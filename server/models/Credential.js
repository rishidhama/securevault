const mongoose = require('mongoose');

const credentialSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    maxlength: [200, 'Username cannot exceed 200 characters']
  },
  encryptedPassword: {
    type: String,
    required: [true, 'Encrypted password is required'],
    maxlength: [1000, 'Encrypted password is too long']
  },
  iv: {
    type: String,
    required: [true, 'Initialization vector is required'],
    maxlength: [100, 'IV is too long']
  },
  salt: {
    type: String,
    required: [true, 'Salt is required'],
    maxlength: [100, 'Salt is too long']
  },
  url: {
    type: String,
    trim: true,
    maxlength: [500, 'URL cannot exceed 500 characters'],
    default: ''
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    default: ''
  },
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters'],
    default: 'General'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  isFavorite: {
    type: Boolean,
    default: false
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

credentialSchema.index({ userId: 1 });
credentialSchema.index({ title: 'text', username: 'text', notes: 'text' });
credentialSchema.index({ category: 1 });
credentialSchema.index({ isFavorite: 1 });
credentialSchema.index({ createdAt: -1 });

credentialSchema.virtual('passwordStrength').get(function() {
  return null;
});

credentialSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

credentialSchema.statics.getByCategory = function(category) {
  return this.find({ category: category }).sort({ createdAt: -1 });
};

credentialSchema.statics.getFavorites = function() {
  return this.find({ isFavorite: true }).sort({ createdAt: -1 });
};

credentialSchema.methods.toggleFavorite = function() {
  this.isFavorite = !this.isFavorite;
  return this.save();
};

module.exports = mongoose.model('Credential', credentialSchema); 