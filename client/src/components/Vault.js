import React, { useState } from 'react';
import { 
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
  Grid,
  List
} from 'lucide-react';
import toast from 'react-hot-toast';

const Vault = ({
  credentials,
  onDeleteCredential,
  onToggleFavorite,
  decryptPassword,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  showFavorites,
  setShowFavorites
}) => {
  const [showPasswords, setShowPasswords] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Vault</h1>
          <p className="text-secondary-600 mt-1">All your encrypted credentials</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            className="btn-secondary"
            title={`Switch to ${viewMode === 'list' ? 'grid' : 'list'} view`}
          >
            {viewMode === 'list' ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />}
          </button>
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
                <option value="General">General</option>
                <option value="Social Media">Social Media</option>
                <option value="Email">Email</option>
                <option value="Banking">Banking</option>
                <option value="Shopping">Shopping</option>
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Credentials */}
      <div className="space-y-4">
        {credentials.length === 0 ? (
          <div className="card text-center py-12">
            <Shield className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">No credentials found</h3>
            <p className="text-secondary-600">
              {searchTerm || selectedCategory !== 'all' || showFavorites 
                ? 'Try adjusting your search or filters'
                : 'Your vault is empty. Add some credentials to get started.'
              }
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {credentials.map((credential) => (
              <div key={credential._id} className="card-hover">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-secondary-900 truncate">
                        {credential.title}
                      </h3>
                      {credential.isFavorite && (
                        <Star className="w-4 h-4 text-warning-500 fill-current" />
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-secondary-400" />
                        <span className="text-secondary-600">Username:</span>
                        <span className="font-mono text-secondary-900 truncate">{credential.username}</span>
                        <button
                          onClick={() => handleCopyToClipboard(credential.username)}
                          className="text-primary-600 hover:text-primary-700 flex-shrink-0"
                          title="Copy username"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-secondary-400" />
                        <span className="text-secondary-600">Password:</span>
                        <span className="font-mono text-secondary-900">
                          {showPasswords[credential._id] 
                            ? decryptPassword(credential.encryptedPassword, credential.iv, credential.salt)
                            : '----------------'
                          }
                        </span>
                        <button
                          onClick={() => handleTogglePassword(credential._id)}
                          className="text-primary-600 hover:text-primary-700 flex-shrink-0"
                          title={showPasswords[credential._id] ? 'Hide password' : 'Show password'}
                        >
                          {showPasswords[credential._id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => handleCopyToClipboard(
                            decryptPassword(credential.encryptedPassword, credential.iv, credential.salt)
                          )}
                          className="text-primary-600 hover:text-primary-700 flex-shrink-0"
                          title="Copy password"
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
                            <span>-</span>
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
  );
};

export default Vault; 