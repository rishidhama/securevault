import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Star, 
  Eye, 
  EyeOff, 
  Trash2, 
  Copy, 
  Filter,
  Shield,
  Lock,
  Key,
  Globe,
  Calendar,
  Tag,
  ArrowLeft,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { checkPasswordBreach } from '../utils/encryption';
import { Tooltip } from 'react-tooltip';

const Dashboard = ({
  credentials,
  stats,
  categories,
  onAddCredential,
  onDeleteCredential,
  onToggleFavorite,
  decryptPassword,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  showFavorites,
  setShowFavorites,
  user
}) => {
  const [showPasswords, setShowPasswords] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [breachMap, setBreachMap] = useState({});
  const [isCheckingBreaches, setIsCheckingBreaches] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Check breaches for all credentials on mount or when credentials change
  useEffect(() => {
    let isMounted = true;
    async function checkAllBreaches() {
      setIsCheckingBreaches(true);
      const newMap = {};
      for (const cred of credentials) {
        const password = decryptPassword(cred.encryptedPassword, cred.iv, cred.salt);
        if (password) {
          const count = await checkPasswordBreach(password);
          if (!isMounted) return;
          newMap[cred._id] = count;
        }
      }
      if (isMounted) {
        setBreachMap(newMap);
        setIsCheckingBreaches(false);
      }
    }
    if (credentials.length > 0) {
      checkAllBreaches();
    } else {
      setBreachMap({});
    }
    return () => { isMounted = false; };
  }, [credentials, decryptPassword]);

  const totalBreached = Object.values(breachMap).filter(count => count > 0).length;

  const handleCopyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleTogglePassword = (id) => {
    setShowPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this credential?')) {
      try {
        await onDeleteCredential(id);
        toast.success('Credential deleted successfully');
      } catch (error) {
        toast.error('Failed to delete credential');
      }
    }
  };

  const handleToggleFavorite = async (id) => {
    try {
      await onToggleFavorite(id);
      toast.success('Favorite status updated');
    } catch (error) {
      toast.error('Failed to update favorite status');
    }
  };



  return (
    <>
      <Tooltip id="breach-tooltip" />
      <div className="space-y-8 animate-fade-in">
        {/* Back Button (if not on dashboard root) */}
        {location.pathname !== '/' && (
          <button onClick={() => navigate(-1)} className="mb-4 btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gradient">Dashboard</h1>
            <p className="text-secondary-600 mt-1">Manage your secure credentials</p>
            {isCheckingBreaches ? (
              <span className="text-xs text-warning-600 flex items-center gap-1 mt-2"><span className="animate-spin w-3 h-3 border-2 border-warning-600 border-t-transparent rounded-full"></span> Checking for breached passwords...</span>
            ) : (
              <span className={`text-xs flex items-center gap-1 mt-2 ${totalBreached > 0 ? 'text-danger-600' : 'text-success-600'}`}>
                {totalBreached > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                {totalBreached > 0 ? `${totalBreached} breached password${totalBreached > 1 ? 's' : ''} found!` : 'No breached passwords found.'}
              </span>
            )}
          </div>
          
          <Link
            to="/add"
            className="btn-primary inline-flex items-center shadow-glow"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Credential
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="card-hover animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Total Credentials</p>
                <p className="text-2xl font-bold text-secondary-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-primary-100 rounded-lg">
                <Shield className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </div>

          <div className="card-hover animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Favorites</p>
                <p className="text-2xl font-bold text-secondary-900">{stats.favorites}</p>
              </div>
              <div className="p-3 bg-warning-100 rounded-lg">
                <Star className="w-6 h-6 text-warning-600" />
              </div>
            </div>
          </div>

          <div className="card-hover animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Categories</p>
                <p className="text-2xl font-bold text-secondary-900">{stats.categories}</p>
              </div>
              <div className="p-3 bg-success-100 rounded-lg">
                <Tag className="w-6 h-6 text-success-600" />
              </div>
            </div>
          </div>
        </div>


        {/* Search and Filters */}
        <div className="card">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search credentials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn-secondary inline-flex items-center ${showFilters ? 'bg-primary-100 text-primary-700' : ''}`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </button>
              
              <button
                onClick={() => setShowFavorites(!showFavorites)}
                className={`btn-secondary inline-flex items-center ${showFavorites ? 'bg-warning-100 text-warning-700' : ''}`}
              >
                <Star className="w-4 h-4 mr-2" />
                Favorites
              </button>
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-secondary-200">
              <div className="flex flex-wrap gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input max-w-xs"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Credentials List */}
        <div className="space-y-4">
          {credentials.length === 0 ? (
            <div className="card text-center py-12">
              <Shield className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">No credentials found</h3>
              <p className="text-secondary-600 mb-6">
                {searchTerm || selectedCategory !== 'all' || showFavorites 
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first credential'
                }
              </p>
              {!searchTerm && selectedCategory === 'all' && !showFavorites && (
                <Link to="/add" className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Credential
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {credentials.map((credential) => (
                <div key={credential._id} className="card-hover animate-slide-up">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-secondary-900 truncate">
                          {credential.title}
                        </h3>
                        {credential.isFavorite && (
                          <Star className="w-4 h-4 text-warning-500 fill-current" />
                        )}
                        {breachMap[credential._id] > 0 && (
                          <span className="ml-2 flex items-center gap-1 text-danger-600 text-xs"
                            data-tooltip-id="breach-tooltip"
                            data-tooltip-content={`This password has appeared in ${breachMap[credential._id].toLocaleString()} known breaches! Change it immediately.`}
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </span>
                        )}
                        {breachMap[credential._id] === 0 && (
                          <span className="ml-2 flex items-center gap-1 text-success-600 text-xs"
                            data-tooltip-id="breach-tooltip"
                            data-tooltip-content="Password not found in breaches."
                          >
                            <CheckCircle className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4 text-secondary-400" />
                          <span className="text-secondary-600">Username:</span>
                          <span className="font-mono text-secondary-900">{credential.username}</span>
                          <button
                            onClick={() => handleCopyToClipboard(credential.username)}
                            className="text-primary-600 hover:text-primary-700"
                            title="Copy username"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-secondary-400" />
                          <span className="text-secondary-600">Password:</span>
                          <span className={`font-mono ${
                            showPasswords[credential._id] && 
                            decryptPassword(credential.encryptedPassword, credential.iv, credential.salt).includes('***') 
                              ? 'text-danger-600' 
                              : 'text-secondary-900'
                          }`}>
                            {showPasswords[credential._id] 
                              ? decryptPassword(credential.encryptedPassword, credential.iv, credential.salt)
                              : '••••••••••••••••'
                            }
                          </span>
                          <button
                            onClick={() => handleTogglePassword(credential._id)}
                            className="text-primary-600 hover:text-primary-700"
                            title={showPasswords[credential._id] ? 'Hide password' : 'Show password'}
                          >
                            {showPasswords[credential._id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                          <button
                            onClick={() => {
                              const decryptedPassword = decryptPassword(credential.encryptedPassword, credential.iv, credential.salt);
                              if (!decryptedPassword.includes('***')) {
                                handleCopyToClipboard(decryptedPassword);
                              }
                            }}
                            className={`${
                              decryptPassword(credential.encryptedPassword, credential.iv, credential.salt).includes('***')
                                ? 'text-secondary-300 cursor-not-allowed'
                                : 'text-primary-600 hover:text-primary-700'
                            }`}
                            title={
                              decryptPassword(credential.encryptedPassword, credential.iv, credential.salt).includes('***')
                                ? 'Cannot copy - decryption failed'
                                : 'Copy password'
                            }
                            disabled={decryptPassword(credential.encryptedPassword, credential.iv, credential.salt).includes('***')}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        
                        {credential.url && (
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-secondary-400" />
                            <span className="text-secondary-600">URL:</span>
                            <a 
                              href={credential.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-700 truncate"
                            >
                              {credential.url}
                            </a>
                          </div>
                        )}
                        
                        {credential.category && (
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-secondary-400" />
                            <span className="text-secondary-600">Category:</span>
                            <span className="text-secondary-900">{credential.category}</span>
                          </div>
                        )}
                        
                        {credential.notes && (
                          <div className="text-secondary-600 text-sm mt-2">
                            {credential.notes}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs text-secondary-500">
                          <Calendar className="w-3 h-3" />
                          <span>Created: {new Date(credential.createdAt).toLocaleDateString()}</span>
                          {credential.lastModified !== credential.createdAt && (
                            <>
                              <span>•</span>
                              <span>Modified: {new Date(credential.lastModified).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleToggleFavorite(credential._id)}
                        className={`p-2 rounded-lg transition-colors ${
                          credential.isFavorite 
                            ? 'text-warning-600 bg-warning-100 hover:bg-warning-200' 
                            : 'text-secondary-400 hover:text-warning-600 hover:bg-warning-50'
                        }`}
                        title={credential.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <Link
                        to={`/edit/${credential._id}`}
                        className="p-2 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit credential"
                        style={{ display: 'flex', alignItems: 'center' }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13h3l8-8a2.828 2.828 0 00-4-4l-8 8v3zm0 0v3h3" /></svg>
                      </Link>
                      <button
                        onClick={() => handleDelete(credential._id)}
                        className="p-2 text-secondary-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                        title="Delete credential"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard; 