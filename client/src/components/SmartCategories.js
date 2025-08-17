import React, { useState, useEffect, useRef } from 'react';
import { 
  Tag, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Globe,
  ShoppingCart,
  CreditCard,
  Mail,
  Smartphone,
  Building,
  Gamepad2,
  BookOpen,
  Music,
  Video,
  Camera,
  Car,
  Plane,
  Train,
  Home,
  Wifi,
  Shield,
  Settings,
  Sparkles,
  Code
} from 'lucide-react';
import toast from 'react-hot-toast';
import { credentialsAPI } from '../services/api';

const SmartCategories = ({ credentials, onUpdateCredential, onAddCredential }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState({ suggestions: [] });
  const [selectedImprovements, setSelectedImprovements] = useState([]);

  // Predefined smart categories with patterns
  const defaultCategories = [
    {
      id: 'social',
      name: 'Social Media',
      color: '#3B82F6',
      icon: <Globe className="w-4 h-4" />,
      patterns: ['facebook', 'twitter', 'instagram', 'linkedin', 'tiktok', 'snapchat', 'reddit', 'discord', 'telegram', 'whatsapp']
    },
    {
      id: 'shopping',
      name: 'Shopping',
      color: '#10B981',
      icon: <ShoppingCart className="w-4 h-4" />,
      patterns: ['amazon', 'ebay', 'walmart', 'target', 'etsy', 'shopify', 'paypal', 'stripe', 'square']
    },
    {
      id: 'finance',
      name: 'Finance',
      color: '#F59E0B',
      icon: <CreditCard className="w-4 h-4" />,
      patterns: ['bank', 'paypal', 'stripe', 'square', 'chase', 'wells', 'boa', 'citi', 'capitalone', 'robinhood', 'coinbase', 'binance']
    },
    {
      id: 'email',
      name: 'Email',
      color: '#8B5CF6',
      icon: <Mail className="w-4 h-4" />,
      patterns: ['gmail', 'outlook', 'yahoo', 'protonmail', 'icloud', 'mail', 'email']
    },
    {
      id: 'mobile',
      name: 'Mobile Apps',
      color: '#EC4899',
      icon: <Smartphone className="w-4 h-4" />,
      patterns: ['app', 'mobile', 'ios', 'android', 'playstore', 'appstore']
    },
    {
      id: 'development',
      name: 'Development',
      color: '#059669',
      icon: <Code className="w-4 h-4" />,
      patterns: ['github', 'gitlab', 'bitbucket', 'stackoverflow', 'stack', 'npm', 'yarn', 'docker', 'kubernetes', 'aws', 'azure', 'heroku', 'vercel', 'netlify', 'codesandbox', 'replit', 'codepen', 'jsfiddle', 'jsbin']
    },
    {
      id: 'business',
      name: 'Business',
      color: '#6B7280',
      icon: <Building className="w-4 h-4" />,
      patterns: ['office', 'microsoft', 'google', 'slack', 'zoom', 'teams', 'asana', 'trello', 'notion', 'airtable']
    },
    {
      id: 'gaming',
      name: 'Gaming',
      color: '#EF4444',
      icon: <Gamepad2 className="w-4 h-4" />,
      patterns: ['steam', 'epic', 'origin', 'battle', 'blizzard', 'riot', 'nintendo', 'playstation', 'xbox', 'game']
    },
    {
      id: 'education',
      name: 'Education',
      color: '#06B6D4',
      icon: <BookOpen className="w-4 h-4" />,
      patterns: ['coursera', 'udemy', 'khan', 'edx', 'skillshare', 'pluralsight', 'university', 'college', 'school', 'learn', 'neetcode', 'takeuforward', 'leetcode', 'hackerrank', 'codechef', 'geeksforgeeks', 'freecodecamp', 'theodinproject', 'scrimba', 'frontendmasters']
    },
    {
      id: 'entertainment',
      name: 'Entertainment',
      color: '#8B5CF6',
      icon: <Video className="w-4 h-4" />,
      patterns: ['netflix', 'hulu', 'disney', 'youtube', 'spotify', 'apple', 'music', 'video', 'stream', 'podcast']
    },
    {
      id: 'travel',
      name: 'Travel',
      color: '#10B981',
      icon: <Plane className="w-4 h-4" />,
      patterns: ['airbnb', 'booking', 'expedia', 'hotels', 'uber', 'lyft', 'flight', 'hotel', 'travel', 'trip']
    },
    {
      id: 'home',
      name: 'Home & IoT',
      color: '#F59E0B',
      icon: <Home className="w-4 h-4" />,
      patterns: ['nest', 'ring', 'philips', 'hue', 'smart', 'home', 'iot', 'thermostat', 'security', 'camera']
    },
    {
      id: 'security',
      name: 'Security',
      color: '#EF4444',
      icon: <Shield className="w-4 h-4" />,
      patterns: ['vpn', 'antivirus', 'firewall', 'security', 'encryption', 'password', 'auth', '2fa']
    }
  ];

  const loadCategories = async () => {
    try {
      const response = await credentialsAPI.getCategories();
      if (response.success && response.data) {
        // Get unique categories from database
        const dbCategories = response.data;
        
        // Create category objects for database categories
        const customCategories = dbCategories
          .filter(cat => cat && cat !== 'General') // Filter out null/empty and default 'General'
          .map(cat => ({
            id: cat.toLowerCase().replace(/\s+/g, '-'),
            name: cat,
            color: '#6B7280', // Default color for custom categories
            icon: <Tag className="w-4 h-4" />,
            patterns: []
          }));
        
        // Filter out default categories that already exist in custom categories
        const defaultCategoryNames = defaultCategories.map(cat => cat.name.toLowerCase());
        const uniqueCustomCategories = customCategories.filter(cat => 
          !defaultCategoryNames.includes(cat.name.toLowerCase())
        );
        
        // Merge default categories with unique custom categories
        const allCategories = [...defaultCategories, ...uniqueCustomCategories];
        setCategories(allCategories);
      } else {
        // Fallback to default categories if API fails
        setCategories(defaultCategories);
      }
    } catch (error) {
      // Fallback to default categories
      setCategories(defaultCategories);
    }
  };

  useEffect(() => {
    // Load categories from database and merge with default categories
    loadCategories();
  }, []); // Only run once on mount

  useEffect(() => {
    // Auto-tag existing credentials after categories are loaded
    
    if (categories.length > 0 && credentials && Array.isArray(credentials)) {
      autoTagCredentials();
    }
  }, [categories, credentials]); // Run when categories or credentials change

  const autoTagCredentials = async () => {
    
    if (!credentials || !Array.isArray(credentials) || categories.length === 0) {
      return;
    }
    
    let updatedCount = 0;
    let improvedCount = 0;
    const updatePromises = [];
    const suggestions = [];
    
    credentials.forEach(credential => {
      
      if (credential && credential.url) {
        const suggestedCategory = suggestCategory(credential.url);
        
        if (suggestedCategory) {
          // Case 1: No category assigned
          if (!credential.category) {
            updatePromises.push(
              credentialsAPI.updateCategory(credential._id, suggestedCategory.id)
                .then(() => {
                  updatedCount++;
                  onUpdateCredential(credential._id, { category: suggestedCategory.id });
                })
                .catch(error => {
                  console.error(`Failed to update category for credential ${credential._id}:`, error);
                })
            );
          }
          // Case 2: Has category but auto-tagging suggests a better one
          else if (credential.category !== suggestedCategory.id) {
            suggestions.push({
              credential,
              currentCategory: credential.category,
              suggestedCategory: suggestedCategory.id,
              suggestedCategoryName: suggestedCategory.name
            });
            improvedCount++;
          }
        }
      }
    });
    
    // Apply auto-tagging for uncategorized credentials
    if (updatePromises.length > 0) {
      try {
        await Promise.all(updatePromises);
        if (updatedCount > 0) {
          toast.success(`Auto-tagged ${updatedCount} uncategorized credentials!`);
        }
      } catch (error) {
        console.error('Error during auto-tagging:', error);
        toast.error('Some credentials failed to auto-tag. Please try again.');
      }
    }
    
    // Show suggestions for improvement
    if (suggestions.length > 0) {
      setConfirmData({ suggestions });
      setSelectedImprovements(suggestions.map(s => s.credential._id)); // Auto-select all
      setShowConfirmModal(true);
      return; // Don't proceed until user confirms
    }
    
    if (updatePromises.length === 0 && suggestions.length === 0) {
      toast.success('All credentials are properly categorized!');
    }
  };

  const handleConfirmImprovements = async () => {
    const { suggestions } = confirmData;
    
    // Filter suggestions to only include selected ones
    const selectedSuggestions = suggestions.filter(suggestion => 
      selectedImprovements.includes(suggestion.credential._id)
    );
    
    if (selectedSuggestions.length === 0) {
      toast.error('Please select at least one credential to improve');
      return;
    }
    
    const improvementPromises = selectedSuggestions.map(suggestion =>
      credentialsAPI.updateCategory(suggestion.credential._id, suggestion.suggestedCategory)
        .then(() => {
          onUpdateCredential(suggestion.credential._id, { category: suggestion.suggestedCategory });
        })
        .catch(error => {
          console.error(`Failed to improve category for credential ${suggestion.credential._id}:`, error);
        })
    );
    
    try {
      await Promise.all(improvementPromises);
      toast.success(`Improved categorization for ${selectedSuggestions.length} credentials!`);
    } catch (error) {
      console.error('Error during category improvements:', error);
      toast.error('Some improvements failed. Please try again.');
    }
    
    setShowConfirmModal(false);
    setConfirmData({ suggestions: [] });
    setSelectedImprovements([]);
  };

  const suggestCategory = (website) => {
    if (!website) return null;
    
    // Extract domain from URL (remove protocol, www, and path)
    let domain = website.toLowerCase();
    domain = domain.replace(/^https?:\/\//, ''); // Remove protocol
    domain = domain.replace(/^www\./, ''); // Remove www
    domain = domain.split('/')[0]; // Remove path
    domain = domain.split('?')[0]; // Remove query parameters
    domain = domain.split('#')[0]; // Remove hash
    
    for (const category of categories) {
      if (category.patterns.some(pattern => domain.includes(pattern))) {
        return category;
      }
    }
    
    return null;
  };

  const addCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    const newCategory = {
      id: newCategoryName.toLowerCase().replace(/\s+/g, '-'),
      name: newCategoryName.trim(),
      color: newCategoryColor,
      icon: <Tag className="w-4 h-4" />,
      patterns: []
    };

    setCategories(prev => [...prev, newCategory]);
    setNewCategoryName('');
    setNewCategoryColor('#3B82F6');
    setShowAddCategory(false);
    toast.success('Category added successfully!');
    loadCategories(); // Refresh categories after adding
  };

  const editCategory = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      setEditingCategory(category);
      setNewCategoryName(category.name);
      setNewCategoryColor(category.color);
    }
  };

  const updateCategory = () => {
    if (!editingCategory || !newCategoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    setCategories(prev => 
      prev.map(cat => 
        cat.id === editingCategory.id 
          ? { ...cat, name: newCategoryName.trim(), color: newCategoryColor }
          : cat
      )
    );

    setEditingCategory(null);
    setNewCategoryName('');
    setNewCategoryColor('#3B82F6');
    toast.success('Category updated successfully!');
  };

  const deleteCategory = (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? Credentials in this category will be moved to "Uncategorized".')) {
      // Move credentials to uncategorized
      credentials.forEach(cred => {
        if (cred.category === categoryId) {
          onUpdateCredential(cred._id, { category: null });
        }
      });

      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      toast.success('Category deleted successfully!');
    }
  };

  const getCategoryIcon = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.icon || <Tag className="w-4 h-4" />;
  };

  const getCategoryColor = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.color || '#6B7280';
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Uncategorized';
  };

  const filteredCredentials = (credentials || []).filter(cred => {
    if (!cred) return false;
    const matchesCategory = selectedCategory === 'all' || cred.category === selectedCategory;
    const matchesSearch = (cred.url && cred.url.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (cred.username && cred.username.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categoryStats = categories.map(category => ({
    ...category,
    count: credentials.filter(cred => cred && cred.category === category.id).length
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Categories</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Organize your credentials with intelligent auto-tagging</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              autoTagCredentials();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
            title="Auto-tag untagged credentials"
          >
            <Sparkles className="w-4 h-4" />
            Auto-Tag
          </button>
          <button
            onClick={() => setShowAddCategory(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                 {/* All Categories Card */}
         <div
                        className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
               selectedCategory === 'all' ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/40' : ''
             }`}
           onClick={() => setSelectedCategory('all')}
         >
           <div className="flex items-center justify-between mb-2">
             <div 
               className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-600 shadow-lg flex-shrink-0"
             >
               <Tag className="w-5 h-5 text-white" />
             </div>
             <span className={`text-lg font-bold ml-2 ${
               selectedCategory === 'all' 
                 ? 'text-blue-900 dark:text-blue-50' 
                 : 'text-gray-900 dark:text-white'
             }`}>{credentials.length}</span>
           </div>
           <div className={`text-sm font-semibold ${
             selectedCategory === 'all' 
               ? 'text-blue-900 dark:text-blue-50' 
               : 'text-gray-900 dark:text-white'
           }`}>All Categories</div>
         </div>
        
                 {categoryStats.map(category => (
           <div
             key={category.id}
             className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
               selectedCategory === category.id ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/40' : ''
             }`}
             onClick={() => setSelectedCategory(category.id)}
           >
             <div className="flex items-center justify-between mb-2">
               <div 
                 className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
                 style={{ backgroundColor: category.color }}
               >
                 <div className="text-white">
                   {category.icon}
                 </div>
               </div>
               <div className="flex items-center gap-1 ml-2">
                 <span className={`text-lg font-bold ${
                   selectedCategory === category.id 
                     ? 'text-blue-900 dark:text-blue-50' 
                     : 'text-gray-900 dark:text-white'
                 }`}>{category.count}</span>
                 {category.id !== 'social' && category.id !== 'shopping' && category.id !== 'finance' && (
                   <div className="flex items-center gap-1 ml-2">
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         editCategory(category.id);
                       }}
                       className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                       title="Edit category"
                     >
                       <Edit className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
                     </button>
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         deleteCategory(category.id);
                       }}
                       className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                       title="Delete category"
                     >
                       <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                     </button>
                   </div>
                 )}
               </div>
             </div>
             <div className={`text-sm font-semibold ${
               selectedCategory === category.id 
                 ? 'text-blue-900 dark:text-blue-50' 
                 : 'text-gray-900 dark:text-white'
             }`}>{category.name}</div>
           </div>
         ))}
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search credentials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-medium transition-all duration-200"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium transition-all duration-200"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name} ({credentials.filter(cred => cred.category === category.id).length})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Credentials List */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {selectedCategory === 'all' ? 'All Credentials' : getCategoryName(selectedCategory)}
          </h3>
          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
            {filteredCredentials.length} credentials
          </span>
        </div>
        
        <div className="space-y-3">
          {filteredCredentials.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-500 dark:text-gray-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-300 font-medium">No credentials found</p>
            </div>
          ) : (
                         filteredCredentials.map(credential => (
               <div key={credential._id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                 <div className="flex items-center gap-3">
                   <div 
                     className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                     style={{ backgroundColor: getCategoryColor(credential.category) + '20' }}
                   >
                     <div style={{ color: getCategoryColor(credential.category) }}>
                       {getCategoryIcon(credential.category)}
                     </div>
                   </div>
                   <div className="min-w-0 flex-1">
                     <div className="font-bold text-gray-900 dark:text-white text-lg truncate">{credential.url || 'Unknown Website'}</div>
                     <div className="text-gray-600 dark:text-gray-300 font-medium truncate">{credential.username || 'No Username'}</div>
                   </div>
                 </div>
                 <div className="flex items-center gap-2">
                   <select
                     value={credential.category || ''}
                     onChange={async (e) => {
                       const newCategory = e.target.value || null;
                       try {
                         await credentialsAPI.updateCategory(credential._id, newCategory);
                         onUpdateCredential(credential._id, { category: newCategory });
                       } catch (error) {
                         console.error('Failed to update category:', error);
                         toast.error('Failed to update category. Please try again.');
                       }
                     }}
                     className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium transition-all duration-200"
                     onClick={(e) => e.stopPropagation()}
                   >
                     <option value="">Uncategorized</option>
                     {categories.map(cat => (
                       <option key={cat.id} value={cat.id}>
                         {cat.name}
                       </option>
                     ))}
                   </select>
                                        <span 
                       className="px-3 py-1 text-sm font-medium rounded-full border-2"
                       style={{ 
                         backgroundColor: getCategoryColor(credential.category) + '15',
                         borderColor: getCategoryColor(credential.category) + '30',
                         color: getCategoryColor(credential.category),
                         filter: 'brightness(0.8) contrast(1.2)'
                       }}
                     >
                       {getCategoryName(credential.category)}
                     </span>
                 </div>
               </div>
             ))
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Add New Category</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Category Name</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-medium transition-all duration-200"
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Color</label>
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="w-full h-12 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={addCategory}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Add Category
              </button>
              <button
                onClick={() => setShowAddCategory(false)}
                className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Edit Category</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Category Name</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-medium transition-all duration-200"
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Color</label>
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="w-full h-12 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={updateCategory}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Update Category
              </button>
              <button
                onClick={() => setEditingCategory(null)}
                className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Improvements Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Confirm Category Improvements</h3>
            
            <div className="mb-8">
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
                Found {confirmData.suggestions.length} credentials that could be better categorized.
                Select which ones you'd like to improve:
              </p>
              
              {/* Select All/None Controls */}
              <div className="flex items-center justify-between mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {selectedImprovements.length} of {confirmData.suggestions.length} selected
                </span>
                <div className="flex gap-3">
                  {selectedImprovements.length === 0 ? (
                    <button
                      onClick={() => setSelectedImprovements(confirmData.suggestions.map(s => s.credential._id))}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline font-medium"
                    >
                      Select All
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedImprovements([])}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline font-medium"
                    >
                      Select None
                    </button>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                {confirmData.suggestions.map((suggestion, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-gray-900 dark:text-white">{suggestion.credential.url}</div>
                      <input
                        type="checkbox"
                        checked={selectedImprovements.includes(suggestion.credential._id)}
                        onChange={() => {
                          setSelectedImprovements(prev => {
                            if (prev.includes(suggestion.credential._id)) {
                              return prev.filter(id => id !== suggestion.credential._id);
                            } else {
                              return [...prev, suggestion.credential._id];
                            }
                          });
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                      />
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="line-through">{suggestion.currentCategory}</span>
                      <span className="mx-3 text-gray-500 dark:text-gray-400">→</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{suggestion.suggestedCategoryName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedImprovements([]);
                }}
                className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImprovements}
                disabled={selectedImprovements.length === 0}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply Selected ({selectedImprovements.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartCategories;