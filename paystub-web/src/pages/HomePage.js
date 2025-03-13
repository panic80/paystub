import React from 'react';
import { Link } from 'react-router-dom';
import PDFUploader from '../components/PDFUploader';
import { DocumentTextIcon, DocumentDuplicateIcon, UserGroupIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const FeatureCard = ({ icon: Icon, title, description, linkTo, linkText }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-100 dark:border-gray-700">
    <div className="p-6">
      <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-12 h-12 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
      </div>
      <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>
      <Link 
        to={linkTo} 
        className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
      >
        {linkText}
        <ChevronRightIcon className="h-4 w-4 ml-1" />
      </Link>
    </div>
  </div>
);

const HomePage = () => {
  return (
    <div className="mx-auto">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-800 dark:to-indigo-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              Paystub Management <span className="text-blue-200">Simplified</span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-blue-100 mb-8">
              Split, organize, and store your paystub PDFs in one centralized location.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link 
                to="/upload" 
                className="btn bg-white text-blue-600 hover:bg-blue-50 font-semibold inline-flex items-center py-3 px-6 rounded-lg shadow-md transition duration-200"
              >
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Upload PDF
              </Link>
              <Link 
                to="/database" 
                className="btn bg-blue-800 bg-opacity-30 text-white hover:bg-opacity-40 font-semibold inline-flex items-center py-3 px-6 rounded-lg shadow-md transition duration-200"
              >
                <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
                View Database
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Upload Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Quick Upload</h2>
          <PDFUploader />
        </div>
      </div>
      
      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white text-center">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={DocumentTextIcon}
            title="Split PDFs"
            description="Upload multi-page PDFs and automatically split them into individual paystubs."
            linkTo="/upload"
            linkText="Upload & Split"
          />
          <FeatureCard 
            icon={DocumentDuplicateIcon}
            title="Manage Statements"
            description="View, download and organize all your processed paystubs in one place."
            linkTo="/database"
            linkText="Browse Database"
          />
          <FeatureCard 
            icon={UserGroupIcon}
            title="Employee Information"
            description="Maintain and update contact information for all individuals."
            linkTo="/individuals"
            linkText="Manage People"
          />
        </div>
      </div>
      
      {/* How It Works Section */}
      <div className="bg-gray-50 dark:bg-gray-800 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-12 text-gray-900 dark:text-white text-center">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full h-16 w-16 flex items-center justify-center text-2xl font-bold text-blue-600 dark:text-blue-300 mb-4">1</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Upload PDF</h3>
              <p className="text-gray-600 dark:text-gray-400">Upload your multi-page paystub PDF file.</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full h-16 w-16 flex items-center justify-center text-2xl font-bold text-blue-600 dark:text-blue-300 mb-4">2</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Automatic Processing</h3>
              <p className="text-gray-600 dark:text-gray-400">The system automatically splits and organizes your paystubs.</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full h-16 w-16 flex items-center justify-center text-2xl font-bold text-blue-600 dark:text-blue-300 mb-4">3</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Access Anywhere</h3>
              <p className="text-gray-600 dark:text-gray-400">View, download, and manage your paystubs from any device.</p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link 
              to="/upload" 
              className="btn bg-blue-600 hover:bg-blue-700 text-white font-semibold inline-flex items-center py-3 px-6 rounded-lg shadow-md transition duration-200"
            >
              Get Started Now
              <ChevronRightIcon className="h-5 w-5 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 