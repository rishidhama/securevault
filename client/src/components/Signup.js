import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, User, KeyRound, Eye, EyeOff, Shield, ArrowRight, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

const Signup = ({ onSignupSuccess }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [masterKey, setMasterKey] = useState('');
  const [confirmKey, setConfirmKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Please enter a valid email address');
      }
      if (name.trim().length < 2) {
        throw new Error('Please enter a valid name (min 2 characters)');
      }
      if (masterKey.length < 8) {
        throw new Error('Master key must be at least 8 characters');
      }
      if (masterKey !== confirmKey) {
        throw new Error('Master key and confirmation do not match');
      }

      // Call backend API using authAPI
      const response = await authAPI.register({
        email: email.trim(),
        name: name.trim(),
        masterKey
      });

      if (response.success) {
        const data = response.data;
        
        // Success - store token and user info
        localStorage.setItem('securevault_token', data.token);
        localStorage.setItem('securevault_user', JSON.stringify(data.user));
        
        toast.success('Account created successfully!');
        
        // Call parent callback if provided
        if (onSignupSuccess) {
          onSignupSuccess(data);
        }
        
        // Navigate to dashboard
        navigate('/');
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-3">
            <Shield className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gradient mb-1">Create Account</h1>
          <p className="text-secondary-600">Get started with a secure, zero-knowledge vault</p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Email</label>
              <div className="relative">
                <input
                  type="email"
                  className="input pl-10"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Mail className="w-4 h-4 text-secondary-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Name (Username)</label>
              <div className="relative">
                <input
                  type="text"
                  className="input pl-10"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  disabled={isLoading}
                />
                <User className="w-4 h-4 text-secondary-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Master Key</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  className="input pl-10 pr-10"
                  placeholder="Create a strong master key"
                  value={masterKey}
                  onChange={(e) => setMasterKey(e.target.value)}
                  required
                  minLength={8}
                  disabled={isLoading}
                />
                <KeyRound className="w-4 h-4 text-secondary-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <button 
                  type="button" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-500" 
                  onClick={() => setShowKey(!showKey)}
                  disabled={isLoading}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-secondary-500 mt-1">Minimum 8 characters. This cannot be recovered if lost.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Re-type Master Key</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Re-enter master key"
                  value={confirmKey}
                  onChange={(e) => setConfirmKey(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button 
                  type="button" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-500" 
                  onClick={() => setShowConfirm(!showConfirm)}
                  disabled={isLoading}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-danger-600 mt-0.5 flex-shrink-0" />
                <p className="text-danger-700 text-sm">{error}</p>
              </div>
            )}
            <button 
              type="submit" 
              className="btn-primary w-full inline-flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>
          <p className="text-sm text-secondary-600 mt-4 text-center">
            Already have an account? <Link to="/login" className="text-primary-600 hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;

