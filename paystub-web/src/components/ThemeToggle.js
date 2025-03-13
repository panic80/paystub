import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';

const ThemeToggle = () => {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-full bg-gray-200 dark:bg-blue-900/30 text-gray-800 dark:text-blue-100 hover:bg-gray-300 dark:hover:bg-blue-900/50 transition-all duration-300 shadow-sm overflow-hidden group"
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="relative z-10 transform transition-transform duration-500 ease-in-out">
        {darkMode ? (
          <SunIcon className="h-5 w-5 text-yellow-500 rotate-0" />
        ) : (
          <MoonIcon className="h-5 w-5 text-blue-600" />
        )}
      </div>
      <span className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-blue-400 dark:from-yellow-400 dark:to-yellow-300 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-full"></span>
    </button>
  );
};

export default ThemeToggle; 