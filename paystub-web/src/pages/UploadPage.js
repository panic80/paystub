import React from 'react';
import PDFUploader from '../components/PDFUploader';
import { DocumentTextIcon, ArrowPathIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';

const UploadPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">Upload and Split PDF</h1>
      
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6 text-center">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-4 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                <DocumentTextIcon className="h-8 w-8 text-blue-600 dark:text-blue-300" />
              </div>
              <h3 className="font-bold mb-2 text-gray-900 dark:text-white">1. Upload</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upload your multi-page paystub PDF file
              </p>
            </div>
            
            <div className="card p-6 text-center">
              <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-4 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                <ArrowPathIcon className="h-8 w-8 text-purple-600 dark:text-purple-300" />
              </div>
              <h3 className="font-bold mb-2 text-gray-900 dark:text-white">2. Process</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Our system processes and splits the PDF
              </p>
            </div>
            
            <div className="card p-6 text-center">
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-4 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                <DocumentDuplicateIcon className="h-8 w-8 text-green-600 dark:text-green-300" />
              </div>
              <h3 className="font-bold mb-2 text-gray-900 dark:text-white">3. Organize</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Individual paystubs are saved and organized
              </p>
            </div>
          </div>
        </div>
        
        <PDFUploader />
        
        <div className="mt-8 card p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Tips for Best Results</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
            <li>Ensure your PDF is not password protected</li>
            <li>Make sure each paystub is on a separate page</li>
            <li>For best results, use PDFs with consistent formatting</li>
            <li>Maximum file size is 10MB</li>
            <li>Supported format is PDF only</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UploadPage; 