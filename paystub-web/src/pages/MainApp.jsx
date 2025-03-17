import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { PaperAirplaneIcon, DocumentTextIcon, TableCellsIcon, UserIcon } from '@heroicons/react/24/outline';
import { splitPdf } from '../utils/pdfProcessor.js';
import { clientDb } from '../utils/clientDb.js';
import EditIndividualModal from '../components/EditIndividualModal.jsx';

const MainApp = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [paystubs, setPaystubs] = useState([]);
  const [error, setError] = useState(null);
  const [individuals, setIndividuals] = useState([]);
  const [editingIndividual, setEditingIndividual] = useState(null);
  const [selectedIndividual, setSelectedIndividual] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const individualsData = await clientDb.getIndividuals();
      const paystubsData = await clientDb.getPaystubs();
      
      setIndividuals(individualsData);
      setPaystubs(paystubsData);
    } catch (error) {
      setError('Failed to load data from database');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/pdf': ['.pdf']
    },
    onDrop: acceptedFiles => {
      setFiles(prev => [...prev, ...acceptedFiles]);
      setError(null);
    }
  });

  const handleProcessFiles = async () => {
    if (files.length === 0) {
      setError("Please select at least one PDF file to process.");
      return;
    }
    
    setProcessing(true);
    setProcessingProgress(0);
    setError(null);
    
    try {
      let processedCount = 0;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileData = await readFileAsArrayBuffer(file);
        
        // Process PDF locally using the JavaScript implementation
        const results = await splitPdf(fileData, (progress) => {
          // Calculate overall progress including all files
          const fileProgress = progress / 100;
          const overallProgress = ((i + fileProgress) / files.length) * 100;
          setProcessingProgress(overallProgress);
        });
        
        // Save processed pages to database
        await clientDb.processPdfs(results);
        processedCount += results.length;
      }
      
      // Reload data after processing
      await loadData();
      
      setProcessingComplete(true);
      setProcessing(false);
      setActiveTab('database');
      setFiles([]);
      
      console.log(`Successfully processed ${processedCount} pages.`);
    } catch (error) {
      console.error("Error processing PDF files:", error);
      setError(`Failed to process PDF files: ${error.message}`);
      setProcessing(false);
    }
  };

  const handleDeletePaystub = async (id) => {
    if (!window.confirm('Are you sure you want to delete this paystub?')) {
      return;
    }

    try {
      await clientDb.deletePaystub(id);
      await loadData(); // Reload data after deletion
    } catch (error) {
      setError('Failed to delete paystub');
      console.error('Error deleting paystub:', error);
    }
  };

  const handleEditIndividual = (individual) => {
    setEditingIndividual(individual);
  };

  const handleUpdateIndividual = async (updatedIndividual) => {
    try {
      await loadData(); // Reload data after update
    } catch (error) {
      setError('Failed to update individual information');
      console.error('Error updating individual:', error);
    }
  };

  const handleViewIndividualDetails = async (individual) => {
    try {
      const paystubs = await clientDb.getPaystubs(individual.id);
      setSelectedIndividual({
        ...individual,
        paystubs
      });
      setActiveTab('database');
    } catch (error) {
      setError('Failed to load individual details');
      console.error('Error loading individual details:', error);
    }
  };

  // Utility function to read file as ArrayBuffer
  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const renderUploadSection = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">Upload Paystubs</h2>
        
        <div {...getRootProps()} className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
          <input {...getInputProps()} />
          <DocumentTextIcon className="h-10 w-10 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">Drag &amp; drop PDF files here, or click to select files</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Only PDF files are accepted</p>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}
        
        {files.length > 0 && (
          <div className="mt-4">
            <h3 className="text-md font-medium mb-2 text-gray-700 dark:text-gray-300">Files to process ({files.length})</h3>
            <ul className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {files.map((file, index) => (
                <li key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                  <div className="flex items-center overflow-hidden">
                    <DocumentTextIcon className="h-4 w-4 flex-shrink-0 text-blue-500 dark:text-blue-400 mr-2" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 mr-2 truncate">{file.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-500 flex-shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button 
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex-shrink-0 ml-2"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={handleProcessFiles}
              disabled={processing}
              className="flex items-center justify-center w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:bg-blue-300 dark:disabled:bg-blue-800"
            >
              {processing ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing... {processingProgress.toFixed(0)}%</span>
                </div>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                  Process Files
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderDatabaseSection = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">Paystub Database</h2>
          {selectedIndividual && (
            <div className="flex items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">
                Viewing: {selectedIndividual.name}
              </span>
              <button
                onClick={() => setSelectedIndividual(null)}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                View All
              </button>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {paystubs.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg text-center">
                <p className="text-gray-600 dark:text-gray-400">No paystubs found. Upload some files to get started.</p>
              </div>
            ) : (
              <div>
                <table className="w-full table-fixed border-collapse">
                  <colgroup>
                    <col className="w-1/3" />
                    <col className="w-1/5" />
                    <col className="w-1/5" />
                    <col className="w-1/4" />
                  </colgroup>
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {(selectedIndividual ? selectedIndividual.paystubs : paystubs).map(paystub => (
                      <tr key={paystub.id}>
                        <td className="px-2 py-2 text-sm text-gray-700 dark:text-gray-300 truncate">{paystub.name}</td>
                        <td className="px-2 py-2 text-sm text-gray-700 dark:text-gray-300">{paystub.date}</td>
                        <td className="px-2 py-2 text-sm text-gray-700 dark:text-gray-300">
                          ${paystub.amount ? paystub.amount.toFixed(2) : '0.00'}
                        </td>
                        <td className="px-2 py-2 text-sm text-gray-700 dark:text-gray-300">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => {
                                const pdfBlob = new Blob([paystub.fileData], { type: 'application/pdf' });
                                const url = URL.createObjectURL(pdfBlob);
                                window.open(url);
                              }} 
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              View
                            </button>
                            <button 
                              onClick={() => handleDeletePaystub(paystub.id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  const renderIndividualsSection = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">Individuals</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {individuals.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg text-center">
                <p className="text-gray-600 dark:text-gray-400">No individuals found. Process some paystubs to get started.</p>
              </div>
            ) : (
              <div>
                <table className="w-full table-fixed border-collapse">
                  <colgroup>
                    <col className="w-1/6" />
                    <col className="w-1/12" />
                    <col className="w-1/6" />
                    <col className="w-1/3" />
                    <col className="w-1/6" />
                  </colgroup>
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Docs</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Earnings</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Contact</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {individuals.map(individual => (
                      <tr key={individual.id}>
                        <td className="px-2 py-2 text-sm text-gray-700 dark:text-gray-300 truncate">{individual.name}</td>
                        <td className="px-2 py-2 text-sm text-gray-700 dark:text-gray-300 text-center">{individual.paystubCount}</td>
                        <td className="px-2 py-2 text-sm text-gray-700 dark:text-gray-300">${individual.totalEarnings.toFixed(2)}</td>
                        <td className="px-2 py-2 text-sm text-gray-700 dark:text-gray-300">
                          <div className="flex flex-col">
                            {individual.email && <span className="truncate text-xs">{individual.email}</span>}
                            {individual.phone_number && <span className="text-xs">{individual.phone_number}</span>}
                            {individual.address && <span className="truncate text-xs">{individual.address}</span>}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-sm">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleViewIndividualDetails(individual)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              View
                            </button>
                            <button 
                              onClick={() => handleEditIndividual(individual)}
                              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 max-w-4xl mx-auto px-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="flex border-b border-gray-200 dark:border-gray-700 max-w-3xl mx-auto">
          <button
            className={`px-4 py-3 flex items-center space-x-2 border-b-2 font-medium text-sm ${
              activeTab === 'upload'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('upload')}
          >
            <DocumentTextIcon className="h-5 w-5" />
            <span>Upload</span>
          </button>
          <button
            className={`px-4 py-3 flex items-center space-x-2 border-b-2 font-medium text-sm ${
              activeTab === 'database'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('database')}
          >
            <TableCellsIcon className="h-5 w-5" />
            <span>Database</span>
          </button>
          <button
            className={`px-4 py-3 flex items-center space-x-2 border-b-2 font-medium text-sm ${
              activeTab === 'individuals'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('individuals')}
          >
            <UserIcon className="h-5 w-5" />
            <span>Individuals</span>
          </button>
        </div>
      </div>

      {activeTab === 'upload' && renderUploadSection()}
      {activeTab === 'database' && renderDatabaseSection()}
      {activeTab === 'individuals' && renderIndividualsSection()}

      {editingIndividual && (
        <EditIndividualModal
          individual={editingIndividual}
          onClose={() => setEditingIndividual(null)}
          onUpdate={handleUpdateIndividual}
        />
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-md">
          {error}
        </div>
      )}
    </div>
  );
};

export default MainApp;
