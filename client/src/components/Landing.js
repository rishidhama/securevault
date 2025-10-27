import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, KeyRound, CheckCircle } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Top Nav */}
      <header className="w-full bg-white border-b border-secondary-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-primary-600" />
            <span className="text-lg sm:text-xl font-bold text-gradient">SecureVault</span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link to="/login" className="btn-secondary text-sm px-3 py-2">Login</Link>
            <Link to="/signup" className="btn-primary text-sm px-3 py-2">Sign Up</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-center">
        <section>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-gradient">Your passwords, your control.</h1>
          <p className="mt-4 text-secondary-600 text-lg">
            SecureVault is a zero-knowledge password manager with client-side AES-256 encryption.
            Your master key never leaves your device.
          </p>
          <div className="mt-8 flex gap-3">
            <Link to="/login" className="btn-primary inline-flex items-center">
              <Lock className="w-4 h-4 mr-2" />
              Login
            </Link>
            <Link to="/signup" className="btn-secondary inline-flex items-center">
              <KeyRound className="w-4 h-4 mr-2" />
              Create Account
            </Link>
          </div>
          <ul className="mt-8 space-y-3">
            {["Client-side AES-256-CBC encryption", "Zero-knowledge architecture", "Modern, responsive UI", "Open, extensible API"].map((item) => (
              <li key={item} className="flex items-center gap-3 text-secondary-700">
                <CheckCircle className="w-5 h-5 text-success-600" />
                {item}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">How SecureVault works</h2>
            <ol className="list-decimal list-inside space-y-2 text-secondary-700">
              <li>Create an account with your email and a strong master key.</li>
              <li>Your passwords are encrypted locally using your master key.</li>
              <li>Only encrypted data is stored on the server.</li>
              <li>To unlock, enter your email and master key. Decryption happens on your device.</li>
            </ol>
            <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-lg text-sm text-primary-800">
              Tip: Choose a master key that is long and memorable. It cannot be recovered if lost.
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Landing;

