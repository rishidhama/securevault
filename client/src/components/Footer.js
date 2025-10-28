import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full border-t border-secondary-200 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-secondary-600">
        <div className="text-center sm:text-left">
          <span className="font-medium text-secondary-800">SecureVault</span> • Built with privacy-first principles
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://drive.google.com/file/d/1alEDqS-xwyzoSphqOT_9yGkgum0mU7Bv/view?usp=drive_link"
            target="_blank"
            rel="noreferrer"
            className="hover:text-primary-600 hover:underline"
          >
            Resume
          </a>
          <a
            href="https://github.com/rishidhama"
            target="_blank"
            rel="noreferrer"
            className="hover:text-primary-600 hover:underline"
          >
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/rishi-dhama"
            target="_blank"
            rel="noreferrer"
            className="hover:text-primary-600 hover:underline"
          >
            LinkedIn
          </a>
          <a
            href="mailto:rishidhama26@gmail.com"
            className="hover:text-primary-600 hover:underline"
          >
            rishidhama26@gmail.com
          </a>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;


