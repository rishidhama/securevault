const mongoose = require('mongoose');

const credentialSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required:true,
    trim: true,
    maxlength: 100
  },
  username: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  encryptedPassword: {
    type: String,
    required: true,
    maxlength: 1000
  },
  iv: {
    type: String,
    required: true,
    maxlength: 100
  },
  salt: {
    type: String,
    required: true,
    maxlength: 100
  },
  url: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: ''
  },
  category: {
    type: String,
    trim: true,
    maxlength: 50,
    default: 'General'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
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