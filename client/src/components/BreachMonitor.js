import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  Bell, 
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Eye,
  EyeOff,
  Settings,
  Download,
  Mail
} from 'lucide-react';
import toast from 'react-hot-toast';
import { checkPasswordBreach } from '../utils/encryption';

const BreachMonitor = ({ credentials, decryptPassword, onUpdateCredential }) => {
  const [breachData, setBreachData] = useState({});
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [settings, setSettings] = useState({
    autoScan: true,
    emailAlerts: true,
    browserNotifications: true,
    scanInterval: 24 // hours
  });
  
  // Use ref to track if we've already performed initial scan
  const hasInitialScan = useRef(false);
  const scanInProgress = useRef(false);

  useEffect(() => {
    if (settings.autoScan && credentials.length > 0 && !hasInitialScan.current) {
      // Only run initial scan once when component mounts with credentials
      hasInitialScan.current = true;
      performBreachScan();
    }
  }, [credentials.length, settings.autoScan]); // Only depend on credentials length and autoScan setting

  // Reset scan state when credentials change significantly
  useEffect(() => {
    // If credentials length changes significantly, allow a fresh scan
    if (credentials.length > 0 && Object.keys(breachData).length > 0) {
      const credentialIds = credentials.map(c => c._id).sort().join(',');
      const breachIds = Object.keys(breachData).sort().join(',');
      
      // If credential IDs don't match, reset scan state
      if (credentialIds !== breachIds) {
        hasInitialScan.current = false;
        setBreachData({});
        setLastScan(null);
      }
    }
  }, [credentials, breachData]);

  // Request notification permission on component mount
  useEffect(() => {
    if (settings.browserNotifications && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [settings.browserNotifications]);

  useEffect(() => {
    // Set up periodic scanning
    if (settings.autoScan) {
      const interval = setInterval(() => {
        // Only run periodic scan if no manual scan is in progress
        if (!scanInProgress.current && !isScanning) {
          performBreachScan();
        }
      }, settings.scanInterval * 60 * 60 * 1000); // Convert hours to milliseconds

      return () => clearInterval(interval);
    }
  }, [settings.autoScan, settings.scanInterval, isScanning]);

  const performBreachScan = async () => {
    // Prevent duplicate scans using ref
    if (scanInProgress.current || isScanning) {
      return;
    }
    
    scanInProgress.current = true;
    setIsScanning(true);
    const newBreachData = {};
    const newNotifications = [];

    try {
      for (const cred of credentials) {
        
        const password = decryptPassword(cred.encryptedPassword, cred.iv, cred.salt);
        if (password) {
          const breachCount = await checkPasswordBreach(password);
          newBreachData[cred._id] = {
            count: breachCount,
            lastChecked: new Date(),
            isBreached: breachCount > 0
          };

          if (breachCount > 0) {
            const websiteName = cred.website || cred.url || 'Unknown Website';
            const username = cred.username || cred.email || 'your account';
            
            newNotifications.push({
              id: Date.now() + crypto.getRandomValues(new Uint32Array(1))[0],
              type: 'breach',
              title: `Security Alert: ${websiteName}`,
              message: `The password for "${websiteName}" (${username}) has been found in ${breachCount} data breaches. Consider changing this password immediately.`,
              timestamp: new Date(),
              credentialId: cred._id,
              website: websiteName,
              username: username,
              breachCount: breachCount,
              read: false
            });
          }
        }
      }

      setBreachData(newBreachData);
      setLastScan(new Date());
      
      // Add new notifications
      setNotifications(prev => [...newNotifications, ...prev]);
      
      // Show browser notification if enabled
      if (settings.browserNotifications && newNotifications.length > 0) {
        newNotifications.forEach(notification => {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.ico'
            });
          }
        });
      }

      // Only show toast if this is a fresh scan with new breaches
      if (newNotifications.length > 0) {
        toast.success(`Breach scan completed. Found ${newNotifications.length} new breaches.`);
      } else {
        toast.success('Breach scan completed. No new breaches found.');
      }
    } catch (error) {
      console.error('Breach scan failed:', error);
      toast.error('Failed to complete breach scan');
    } finally {
      setIsScanning(false);
      scanInProgress.current = false;
    }
  };

  // Using the imported checkPasswordBreach function from encryption utility

  const getSecurityScore = () => {
    if (credentials.length === 0) return 100;
    
    const breachedCount = Object.values(breachData).filter(data => data.isBreached).length;
    const weakPasswords = credentials.filter(cred => {
      const password = decryptPassword(cred.encryptedPassword, cred.iv, cred.salt);
      return password && password.length < 8;
    }).length;
    
    const totalIssues = breachedCount + weakPasswords;
    const maxIssues = credentials.length * 2; // Assume worst case
    const score = Math.max(0, 100 - (totalIssues / maxIssues) * 100);
    
    return Math.round(score);
  };

  const getSecurityLevel = (score) => {
    if (score >= 90) return { level: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 70) return { level: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 50) return { level: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { level: 'Poor', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          toast.success('Browser notifications enabled! You will now receive alerts for security breaches.');
        } else if (permission === 'denied') {
          toast.error('Browser notifications were blocked. Please enable them in your browser settings.');
        }
      } catch (error) {
        console.error('Failed to request notification permission:', error);
        toast.error('Failed to enable browser notifications. Please check your browser settings.');
      }
    } else {
      toast.error('Browser notifications are not supported in this browser.');
    }
  };

  const securityScore = getSecurityScore();
  const securityLevel = getSecurityLevel(securityScore);
  const breachedCredentials = Object.entries(breachData).filter(([_, data]) => data.isBreached);
  const unreadNotifications = notifications.filter(n => !n.read);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gradient">Security Monitor</h2>
          <p className="text-secondary-600">Monitor your passwords for security breaches</p>
        </div>
                 <div className="flex items-center gap-3">
           <button
             onClick={() => setShowNotifications(!showNotifications)}
             className={`relative btn-secondary flex items-center gap-2 transition-all duration-200 ${
               unreadNotifications.length > 0 
                 ? 'ring-2 ring-red-200 hover:ring-red-300 shadow-sm' 
                 : ''
             }`}
             title={showNotifications ? "Hide notifications" : "View notifications"}
           >
             <Bell className={`w-4 h-4 ${unreadNotifications.length > 0 ? 'text-red-600' : ''}`} />
             <span className="hidden sm:inline">Notifications</span>
             {unreadNotifications.length > 0 && (
               <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse font-medium">
                 {unreadNotifications.length}
               </span>
             )}
           </button>
          <button
            onClick={() => {
              if (!isScanning) {
                performBreachScan();
              }
            }}
            disabled={isScanning}
            className="btn-primary flex items-center gap-2"
            title={isScanning ? "Scan in progress..." : "Perform a new security scan"}
          >
            {isScanning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isScanning ? 'Scanning...' : 'Scan Now'}
          </button>
        </div>
      </div>

      {/* Security Score Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Security Score</h3>
            <Shield className={`w-6 h-6 ${securityLevel.color}`} />
          </div>
          <div className="text-center">
            <div className={`text-4xl font-bold ${securityLevel.color} mb-2`}>
              {securityScore}
            </div>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${securityLevel.bg} ${securityLevel.color}`}>
              {securityLevel.level}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Breached Passwords</h3>
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-red-600 mb-2">
              {breachedCredentials.length}
            </div>
            <div className="text-sm text-secondary-600">
              of {credentials.length} total
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Last Scan</h3>
            <Clock className="w-6 h-6 text-secondary-500" />
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">
              {lastScan ? lastScan.toLocaleTimeString() : 'Never'}
            </div>
            <div className="text-sm text-secondary-600">
              {lastScan ? (
                <span>
                  {lastScan.toLocaleDateString()}
                  <br />
                  <span className="text-xs">
                    {Math.round((Date.now() - lastScan.getTime()) / (1000 * 60))} minutes ago
                  </span>
                </span>
              ) : (
                'No scans performed'
              )}
            </div>
          </div>
        </div>
      </div>

             {/* Breached Credentials List */}
       {breachedCredentials.length > 0 && (
         <div className="card">
           <div className="flex items-center justify-between mb-4">
             <div>
               <h3 className="text-lg font-semibold text-red-600">Breached Credentials</h3>
               <p className="text-sm text-secondary-600">
                 {breachedCredentials.length} account{breachedCredentials.length !== 1 ? 's' : ''} with compromised passwords
               </p>
             </div>
             <span className="text-sm text-secondary-600">
               {breachedCredentials.length} found
             </span>
           </div>
          <div className="space-y-3">
            {breachedCredentials.map(([credId, data]) => {
              const credential = credentials.find(c => c._id === credId);
              if (!credential) return null;
              
              return (
                                 <div key={credId} className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                                     <div className="flex items-center gap-3">
                     <AlertTriangle className="w-5 h-5 text-red-500" />
                                          <div>
                       <div className="font-semibold text-gray-900 dark:text-gray-100">{credential.url || 'Unknown Website'}</div>
                       <div className="text-sm text-secondary-600 dark:text-gray-300">
                         {(credential.username || credential.email) && `${credential.username || credential.email} - `}Found in {data.count} data breach{data.count !== 1 ? 'es' : ''}
                       </div>
                       <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                         Last checked: {data.lastChecked.toLocaleString()}
                       </div>
                     </div>
                   </div>
                  <div className="flex items-center gap-2">
                                         <button
                       onClick={() => {
                         // Trigger password change reminder
                         const websiteName = credential.url || 'Unknown Website';
                         toast.success(`Reminder: Change password for ${websiteName}`);
                       }}
                       className="btn-secondary text-sm"
                     >
                      <Zap className="w-4 h-4" />
                      Change Password
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

             {/* Notifications Panel */}
       {showNotifications && (
         <div className="card">
           <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
               <Bell className="w-5 h-5 text-blue-500" />
               <h3 className="text-lg font-semibold">Security Notifications</h3>
               {unreadNotifications.length > 0 && (
                 <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                   {unreadNotifications.length} new
                 </span>
               )}
             </div>
             <div className="flex items-center gap-2">
               {notifications.length > 0 && (
                 <button
                   onClick={clearAllNotifications}
                   className="text-sm text-secondary-600 hover:text-secondary-800 flex items-center gap-1"
                 >
                   <span>Clear All</span>
                 </button>
               )}
               <button
                 onClick={() => setShowNotifications(false)}
                 className="text-secondary-400 hover:text-secondary-600 p-1 rounded"
                 title="Close notifications"
               >
                 ×
               </button>
             </div>
           </div>
           <div className="space-y-3 max-h-96 overflow-y-auto">
             {notifications.length === 0 ? (
                                <div className="text-center py-12">
                   <Bell className="w-12 h-12 text-secondary-400 dark:text-gray-500 mx-auto mb-4" />
                   <h4 className="text-lg font-medium text-secondary-700 dark:text-gray-200 mb-2">No notifications yet</h4>
                   <p className="text-secondary-600 dark:text-gray-300 mb-4">
                     When we detect security issues with your passwords, you'll see notifications here.
                   </p>
                   <div className="space-y-2 text-sm text-secondary-500 dark:text-gray-400 mb-6">
                   <div className="flex items-center gap-2 justify-center">
                     <Shield className="w-4 h-4" />
                     <span>Breach alerts will appear here</span>
                   </div>
                   <div className="flex items-center gap-2 justify-center">
                     <AlertTriangle className="w-4 h-4" />
                     <span>Weak password warnings</span>
                   </div>
                   <div className="flex items-center gap-2 justify-center">
                     <CheckCircle className="w-4 h-4" />
                     <span>Security scan results</span>
                   </div>
                 </div>
                 {!lastScan && (
                   <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                     <div className="flex items-center gap-2 justify-center mb-2">
                       <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                       <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Get started with security monitoring</span>
                     </div>
                     <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                       Run your first security scan to check for password breaches and get notifications.
                     </p>
                     <button
                       onClick={() => {
                         setShowNotifications(false);
                         performBreachScan();
                       }}
                       className="btn-primary text-sm"
                     >
                       Run First Scan
                     </button>
                   </div>
                 )}
               </div>
             ) : (
              notifications.map(notification => (
                                 <div
                   key={notification.id}
                   className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                     notification.read 
                       ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
                       : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 shadow-sm'
                   }`}
                 >
                   <div className="flex items-start justify-between">
                     <div className="flex items-start gap-3 flex-1">
                       {notification.type === 'breach' ? (
                         <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                       ) : (
                         <Bell className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                       )}
                                                                        <div className="flex-1 min-w-0">
                           <div className="font-semibold text-gray-900 dark:text-gray-100">{notification.title}</div>
                           <div className="text-sm text-secondary-600 dark:text-gray-300 mt-1">
                             {notification.message}
                           </div>
                                                     {notification.type === 'breach' && (
                             <div className="mt-2 flex items-center gap-4 text-xs">
                               <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                 <AlertTriangle className="w-3 h-3" />
                                 <span>{notification.breachCount} breaches found</span>
                               </div>
                               <div className="flex items-center gap-1 text-secondary-500 dark:text-gray-400">
                                 <Clock className="w-3 h-3" />
                                 {notification.timestamp.toLocaleString()}
                               </div>
                             </div>
                           )}
                           {notification.type !== 'breach' && (
                             <div className="text-xs text-secondary-500 dark:text-gray-400 mt-2 flex items-center gap-2">
                               <Clock className="w-3 h-3" />
                               {notification.timestamp.toLocaleString()}
                             </div>
                           )}
                        </div>
                     </div>
                                           <div className="flex items-center gap-2 ml-4">
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                        )}
                        {notification.type === 'breach' && (
                          <div className="flex items-center gap-1">
                                                         <button
                               onClick={() => {
                                 // Navigate to edit the breached credential
                                 const credential = credentials.find(c => c._id === notification.credentialId);
                                 if (credential) {
                                   const websiteName = credential.url || 'Unknown Website';
                                   toast.success(`Opening ${websiteName} for password change`);
                                   // You can add navigation logic here if needed
                                 }
                               }}
                               className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 px-2 py-1 rounded transition-colors"
                               title="Change password"
                             >
                              Change Password
                            </button>
                          </div>
                        )}
                        {!notification.read && (
                          <button
                            onClick={() => markNotificationAsRead(notification.id)}
                                                         className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-2 py-1 rounded transition-colors"
                            title="Mark as read"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                   </div>
                 </div>
              ))
            )}
          </div>
        </div>
      )}

             {/* Information Section */}
       <div className="card">
         <h3 className="text-lg font-semibold mb-4">About Breach Detection</h3>
         <div className="space-y-3 text-sm text-secondary-600 dark:text-gray-300">
           <div className="flex items-start gap-2">
             <Shield className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
             <div>
               <span className="font-medium text-gray-900 dark:text-gray-100">How it works:</span> We check your passwords against the HaveIBeenPwned database, which contains over 613 million compromised passwords from data breaches.
             </div>
           </div>
           <div className="flex items-start gap-2">
             <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
             <div>
               <span className="font-medium text-gray-900 dark:text-gray-100">What breach count means:</span> The number shows how many times your password has appeared in known data breaches. Higher numbers indicate the password is more widely compromised.
             </div>
           </div>
           <div className="flex items-start gap-2">
             <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
             <div>
               <span className="font-medium text-gray-900 dark:text-gray-100">What to do:</span> If a password is found in breaches, change it immediately and use a unique, strong password for each account.
             </div>
           </div>
         </div>
       </div>

       {/* Settings */}
       <div className="card">
         <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Auto-scan for breaches</div>
              <div className="text-sm text-secondary-600">
                Automatically scan passwords every {settings.scanInterval} hours
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoScan}
                onChange={(e) => setSettings(prev => ({ ...prev, autoScan: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Browser notifications</div>
              <div className="text-sm text-secondary-600">
                Show desktop notifications for breaches
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.browserNotifications}
                onChange={(e) => setSettings(prev => ({ ...prev, browserNotifications: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {settings.browserNotifications && (
            <div className="space-y-2">
                             <div className="flex items-center gap-2 text-sm">
                 <span className="text-secondary-600 dark:text-gray-300">Notification Status:</span>
                 {Notification.permission === 'granted' ? (
                   <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                     <CheckCircle className="w-4 h-4" />
                     Enabled
                   </span>
                 ) : Notification.permission === 'denied' ? (
                   <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                     <AlertTriangle className="w-4 h-4" />
                     Blocked
                   </span>
                 ) : (
                   <span className="text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                     <Clock className="w-4 h-4" />
                     Not Set
                   </span>
                 )}
               </div>
              {Notification.permission !== 'granted' && (
                <button
                  onClick={requestNotificationPermission}
                  className="btn-secondary text-sm"
                >
                  <Bell className="w-4 h-4" />
                  {Notification.permission === 'denied' ? 'Re-enable' : 'Enable'} Browser Notifications
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BreachMonitor;
