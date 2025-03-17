import React from 'react';
import ThemeToggle from './ThemeToggle';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

const Navbar = () => {
  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-14">
          <div className="flex items-center">
            <div className="bg-blue-100 dark:bg-blue-900 p-1.5 rounded-full">
              <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <span className="ml-2 text-lg font-bold text-gray-900 dark:text-white">Paystub Manager</span>
          </div>
          
          <div className="flex items-center">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 