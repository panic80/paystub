import React from 'react';

function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 text-center py-4">
      <div className="container mx-auto">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          © {new Date().getFullYear()} Paystub App. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;