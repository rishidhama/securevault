import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowRight, Shield } from 'lucide-react';

const LoginEmail = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    // In a real app, we would verify the email/account exists.
    // For now, proceed to master key step with email in state via navigation.
    navigate('/login/master-key', { state: { email } });
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-3">
            <Shield className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gradient mb-1">Login</h1>
          <p className="text-secondary-600">Enter your email to continue</p>
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
                  autoFocus
                />
                <Mail className="w-4 h-4 text-secondary-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>
              {error && <p className="text-danger-600 text-sm mt-1">{error}</p>}
            </div>

            <button type="submit" className="btn-primary w-full inline-flex items-center justify-center">
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </form>
          <p className="text-sm text-secondary-600 mt-4 text-center">
            New here? <Link to="/signup" className="text-primary-600 hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginEmail;

