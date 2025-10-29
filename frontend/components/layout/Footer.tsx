import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-4 px-6">
      <div className="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0">
        {/* Copyright Text */}
        <div className="text-sm text-gray-600 dark:text-gray-400 text-center md:text-left">
          © {currentYear} VidyutAI. All rights reserved.
        </div>
        
        {/* IITGN Logo and Text */}
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Developed at
          </span>
          <img 
            src="/IITGN_logo.webp" 
            alt="IIT Gandhinagar" 
            className="h-8 w-auto opacity-80 hover:opacity-100 transition-opacity"
          />
        </div>
      </div>
    </footer>
  );
};

export default Footer;

