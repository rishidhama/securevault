import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Copy, 
  RefreshCw, 
  Check,
  AlertCircle,
  Shield,
  Lock,
  Globe,
  FileText,
  Zap,
  Activity,
  CheckCircle,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import encryptionService from '../utils/encryption';
import { credentialsAPI, blockchainAPI } from '../services/api';
import { checkPasswordBreach } from '../utils/encryption';

const AddCredential = ({ onAddCredential, onUpdateCredential, categories, isEdit, credentials }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [blockchainStatus, setBlockchainStatus] = useState(null);
  const [blockchainLoading, setBlockchainLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    username: '',
    password: '',
    url: '',
    category: 'General',
    notes: '',
    isFavorite: false
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    strength: 'weak',
    feedback: [],
    maxScore: 7
  });

  const [generatorSettings, setGeneratorSettings] = useState({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: true
  });

  const [existingEncrypted, setExistingEncrypted] = useState({ encryptedPassword: '', iv: '', salt: '' });
  const [errors, setErrors] = useState({});
  const [copied, setCopied] = useState(false);
  const [breachCount, setBreachCount] = useState(null);

  // Fetch blockchain status
  useEffect(() => {
    const fetchBlockchainStatus = async () => {
      try {
        setBlockchainLoading(true);
        
        // Check if user is authenticated
        const token = localStorage.getItem('securevault_token');
        if (!token) {
          console.log('User not authenticated, skipping blockchain status fetch');
          setBlockchainStatus(null);
          setBlockchainLoading(false);
          return;
        }
        
        const status = await blockchainAPI.status();
        setBlockchainStatus(status.ethereum);
      } catch (error) {
        console.log('Blockchain status not available');
        setBlockchainStatus(null);
      } finally {
        setBlockchainLoading(false);
      }
    };

    fetchBlockchainStatus();
  }, []);

  // Prefill form if editing
  React.useEffect(() => {
    if (isEdit && id && credentials) {
      const cred = credentials.find(c => c._id === id);
      if (cred) {
        setFormData({
          title: cred.title || '',
          username: cred.username || '',
          password: '', // For security, do not prefill password
          url: cred.url || '',
          category: cred.category || 'General',
          notes: cred.notes || '',
          isFavorite: cred.isFavorite || false
        });
        setExistingEncrypted({
          encryptedPassword: cred.encryptedPassword,
          iv: cred.iv,
          salt: cred.salt
        });
      }
    }
  }, [isEdit, id, credentials]);

  const handleInputChange = async (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Update password strength and breach check when password changes
    if (name === 'password') {
      const strength = encryptionService.calculatePasswordStrength(value);
      setPasswordStrength(strength);
      setBreachCount(null);
      if (value.length > 0) {
        // Debounce or delay can be added for production
        const count = await checkPasswordBreach(value);
        setBreachCount(count);
      }
    }
  };

  const handleGeneratorSettingChange = (setting) => {
    setGeneratorSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const generatePassword = () => {
    const generatedPassword = encryptionService.generatePassword(
      generatorSettings.length,
      generatorSettings
    );
    setFormData(prev => ({ ...prev, password: generatedPassword }));
    
    // Update password strength
    const strength = encryptionService.calculatePasswordStrength(generatedPassword);
    setPasswordStrength(strength);
    
    toast.success('Password generated successfully!');
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Title is required';
    if (!formData.username.trim()) errs.username = 'Username is required';
    if (!isEdit && (!formData.password || !formData.password.trim())) {
      errs.password = 'Password is required';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setIsLoading(true);
    
    // Debug: Check if master key is available
    const masterKey = sessionStorage.getItem('securevault_master_key');
    
    if (!masterKey) {
      toast.error('Master key not found. Please log in again.');
      setIsLoading(false);
      return;
    }
    
    try {
      if (isEdit && id) {
        let updateData = { ...formData };
        if (formData.password && formData.password.trim()) {
          // Encrypt new password
          const encryptedData = await encryptionService.encryptPassword(
            formData.password,
            masterKey
          );
          updateData.encryptedPassword = encryptedData.encryptedPassword;
          updateData.iv = encryptedData.iv;
          updateData.salt = encryptedData.salt;
        } else {
          // Use existing encrypted values
          updateData.encryptedPassword = existingEncrypted.encryptedPassword;
          updateData.iv = existingEncrypted.iv;
          updateData.salt = existingEncrypted.salt;
        }
        delete updateData.password; // Don't send plain password
        await onUpdateCredential(id, updateData);
        
        // Show blockchain status in success message
        if (blockchainStatus?.initialized) {
          toast.success('Credential updated successfully. Blockchain transaction recorded.');
        } else {
          toast.success('Credential updated successfully!');
        }
      } else {
        // Encrypt password for new credential
        let createData = { ...formData };
        if (formData.password && formData.password.trim()) {
          const encryptedData = await encryptionService.encryptPassword(
            formData.password,
            masterKey
          );
          createData.encryptedPassword = encryptedData.encryptedPassword;
          createData.iv = encryptedData.iv;
          createData.salt = encryptedData.salt;
        } else {
          throw new Error('Password is required for new credentials');
        }
        delete createData.password; // Don't send plain password
        await onAddCredential(createData);
        
        // Show blockchain status in success message
        if (blockchainStatus?.initialized) {
          toast.success('Credential added successfully. Blockchain transaction recorded.');
        } else {
          toast.success('Credential added successfully!');
        }
      }
      navigate('/');
    } catch (error) {
      console.error('Credential operation failed:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        isEdit: isEdit,
        formData: formData
      });
      
      let errorMessage = isEdit ? 'Failed to update credential' : 'Failed to add credential';
      if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const getStrengthColor = (strength) => {
    switch (strength) {
      case 'very-strong': return 'bg-success-600';
      case 'strong': return 'bg-success-500';
      case 'medium': return 'bg-warning-500';
      case 'weak': return 'bg-danger-500';
      default: return 'bg-secondary-300';
    }
  };

  const getStrengthText = (strength) => {
    switch (strength) {
      case 'very-strong': return 'Very Strong';
      case 'strong': return 'Strong';
      case 'medium': return 'Medium';
      case 'weak': return 'Weak';
      default: return 'Unknown';
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/')}
          className="btn-secondary"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gradient">Add Credential</h1>
          <p className="text-secondary-600">Securely store your login information</p>
          {/* Blockchain Status Indicator */}
          {!blockchainLoading && (
            <div className="flex items-center gap-2 mt-2">
              {blockchainStatus?.initialized ? (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle className="w-3 h-3" />
                  <span>Blockchain Active</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-orange-600">
                  <XCircle className="w-3 h-3" />
                  <span>Blockchain Offline</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-600" />
            Basic Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-secondary-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Gmail, GitHub, Bank Account"
                className={`input ${errors.title ? 'border-danger-500' : ''}`}
                required
              />
              {errors.title && <p className="text-danger-600 text-xs mt-1">{errors.title}</p>}
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-secondary-700 mb-1">
                Username/Email *
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter your username or email"
                className="input"
                required
              />
            </div>

            <div>
              <label htmlFor="url" className="block text-sm font-medium text-secondary-700 mb-1">
                Website URL
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
                <input
                  type="url"
                  id="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  placeholder="https://app.service.com"
                  className="input pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Password Section */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary-600" />
            Password
          </h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter password"
                  className={`input ${errors.password ? 'border-danger-500' : ''}`}
                  autoComplete="new-password"
                  required={!isEdit}
                />
                {errors.password && <p className="text-danger-600 text-xs mt-1">{errors.password}</p>}
                {breachCount !== null && breachCount > 0 && (
                  <p className="text-danger-600 text-xs mt-1">
                    This password has appeared in {breachCount.toLocaleString()} breaches! Please choose a different password.
                  </p>
                )}
                {breachCount !== null && breachCount === 0 && formData.password && (
                  <p className="text-success-600 text-xs mt-1">This password was not found in known breaches.</p>
                )}
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-secondary-400 hover:text-secondary-600"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(formData.password)}
                    className="p-1 text-secondary-400 hover:text-secondary-600 relative"
                    title="Copy password"
                  >
                    <Copy className="w-4 h-4" />
                    {copied && <span className="absolute left-1/2 -translate-x-1/2 top-6 text-xs bg-primary-600 text-white px-2 py-1 rounded shadow animate-fade-in">Copied!</span>}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary-600">Password Strength:</span>
                  <span className={`font-medium ${getStrengthColor(passwordStrength.strength).replace('bg-', 'text-')}`}>
                    {getStrengthText(passwordStrength.strength)}
                  </span>
                </div>
                
                <div className="w-full bg-secondary-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength.strength)}`}
                    style={{ width: `${(passwordStrength.score / passwordStrength.maxScore) * 100}%` }}
                  />
                </div>
                
                {passwordStrength.feedback.length > 0 && (
                  <div className="text-xs text-secondary-600 space-y-1">
                    {passwordStrength.feedback.map((feedback, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {feedback}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Password Generator */}
            <div className="border-t border-secondary-200 pt-4">
              <button
                type="button"
                onClick={() => setShowGenerator(!showGenerator)}
                className="btn-secondary inline-flex items-center"
              >
                <Zap className="w-4 h-4 mr-2" />
                Password Generator
              </button>
              
              {showGenerator && (
                <div className="mt-4 p-4 bg-secondary-50 rounded-lg space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Length: {generatorSettings.length}
                      </label>
                      <input
                        type="range"
                        min="8"
                        max="32"
                        value={generatorSettings.length}
                        onChange={(e) => setGeneratorSettings(prev => ({ ...prev, length: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={generatorSettings.includeUppercase}
                          onChange={() => handleGeneratorSettingChange('includeUppercase')}
                          className="rounded"
                        />
                        Uppercase (A-Z)
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={generatorSettings.includeLowercase}
                          onChange={() => handleGeneratorSettingChange('includeLowercase')}
                          className="rounded"
                        />
                        Lowercase (a-z)
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={generatorSettings.includeNumbers}
                          onChange={() => handleGeneratorSettingChange('includeNumbers')}
                          className="rounded"
                        />
                        Numbers (0-9)
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={generatorSettings.includeSymbols}
                          onChange={() => handleGeneratorSettingChange('includeSymbols')}
                          className="rounded"
                        />
                        Symbols (!@#$%^&*)
                      </label>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="btn-primary inline-flex items-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate Password
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            Additional Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-secondary-700 mb-1">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="input"
              >
                <option value="General">General</option>
                <option value="Social Media">Social Media</option>
                <option value="Email">Email</option>
                <option value="Banking">Banking</option>
                <option value="Shopping">Shopping</option>
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
                {categories.filter(cat => !['General', 'Social Media', 'Email', 'Banking', 'Shopping', 'Work', 'Personal'].includes(cat)).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-secondary-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Add security notes, recovery info, or usage context..."
                rows="3"
                className="input resize-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="isFavorite"
                  checked={formData.isFavorite}
                  onChange={handleInputChange}
                  className="rounded"
                />
                Add to favorites
              </label>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex-1 inline-flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Adding...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Add Credential
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCredential; 