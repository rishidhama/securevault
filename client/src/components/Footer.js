import React from 'react';
import { FileText, Github, Linkedin, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="w-full border-t border-secondary-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col items-center gap-3 text-sm">
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-secondary-600">
            <a
              href="https://drive.google.com/file/d/1alEDqS-xwyzoSphqOT_9yGkgum0mU7Bv/view?usp=drive_link"
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary-600 transition-colors inline-flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>Resume</span>
            </a>
            <span className="hidden sm:inline text-secondary-300">|</span>
            <a
              href="https://github.com/rishidhama"
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary-600 transition-colors inline-flex items-center gap-2"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
            <span className="hidden sm:inline text-secondary-300">|</span>
            <a
              href="https://www.linkedin.com/in/rishi-dhama"
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary-600 transition-colors inline-flex items-center gap-2"
            >
              <Linkedin className="w-4 h-4" />
              <span>LinkedIn</span>
            </a>
            <span className="hidden sm:inline text-secondary-300">|</span>
            <a
              href="mailto:rishidhama26@gmail.com"
              className="hover:text-primary-600 transition-colors inline-flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              <span>rishidhama26@gmail.com</span>
            </a>
          </nav>
          <div className="text-xs text-secondary-400">© {new Date().getFullYear()} SecureVault · Built by Rishi Dhama</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


