import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ArrowUpTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { splitPdf } from '../utils/pdfProcessor';
import { insertIndividual, insertPayStatement } from '../utils/databaseManager';

const PDFUploader = () => {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [results, setResults] = useState([]);

  const onDrop = useCallback(acceptedFiles => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setMessage('');
      setResults([]);
    } else {
      setMessage('Please select a valid PDF file.');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  });

  const handleProcessPDF = async () => {
    if (!file) {
      setMessage('Please select a PDF file first.');
      return;
    }

    try {
      setProcessing(true);
      setProgress(0);
      setResults([]);

      // Read the file as ArrayBuffer
      const fileReader = new FileReader();
      
      fileReader.onload = async (event) => {
        try {
          // Get the ArrayBuffer from the reader
          const arrayBuffer = event.target.result;
          
          // Process the PDF
          setProgress(10);
          const splitResults = await splitPdf(arrayBuffer);
          setProgress(50);
          
          // Update progress as we process each page
          const totalPages = splitResults.length;
          const processedResults = [];
          
          for (let i = 0; i < splitResults.length; i++) {
            const result = splitResults[i];
            
            // Update progress
            setProgress(50 + Math.round((i / totalPages) * 40));
            
            // Insert individual into database
            const individualId = await insertIndividual({ name: result.name });
            
            // Insert pay statement into database
            const statement = {
              individualId,
              date: result.date,
              filename: result.filename,
              pdfBytes: result.pdfBytes
            };
            
            const inserted = await insertPayStatement(statement);
            
            processedResults.push({
              ...result,
              individualId,
              inserted
            });
          }
          
          setResults(processedResults);
          setProgress(100);
          setMessage(`Successfully processed ${processedResults.length} pages from the PDF.`);
        } catch (error) {
          console.error("Error processing PDF:", error);
          setMessage(`Error processing PDF: ${error.message}`);
        } finally {
          setProcessing(false);
        }
      };
      
      fileReader.onerror = (event) => {
        console.error("Error reading file:", event.target.error);
        setMessage('Error reading the PDF file.');
        setProcessing(false);
      };
      
      // Read the file as an ArrayBuffer
      fileReader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error processing PDF:", error);
      setMessage(`Error processing PDF: ${error.message}`);
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setProgress(0);
    setMessage('');
    setResults([]);
  };

  const downloadPdf = (result) => {
    try {
      const blob = new Blob([result.pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert(`Error downloading PDF: ${error.message}`);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Upload PDF</h2>
      
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-primary bg-primary/10' 
            : 'border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary'}`}
      >
        <input {...getInputProps()} />
        <ArrowUpTrayIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500" />
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {isDragActive
            ? "Drop the PDF file here..."
            : "Drag and drop a PDF file here, or click to select a file"}
        </p>
      </div>

      {file && (
        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center">
          <DocumentTextIcon className="h-6 w-6 text-primary mr-2" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <button 
            onClick={resetForm}
            className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
          >
            Remove
          </button>
        </div>
      )}

      {processing && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-primary h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Processing: {progress}%</p>
        </div>
      )}

      {message && (
        <div className={`mt-4 p-3 rounded-md ${message.includes('Success') ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
          {message}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Processed Files</h3>
          <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
            {results.map((result, index) => (
              <div 
                key={index} 
                className="p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 flex justify-between items-center"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{result.filename}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {result.inserted ? 'Added to database' : 'Already exists in database'}
                  </p>
                </div>
                <button
                  onClick={() => downloadPdf(result)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={handleProcessPDF}
          disabled={!file || processing}
          className={`btn btn-primary w-full ${(!file || processing) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {processing ? 'Processing...' : 'Process PDF'}
        </button>
      </div>
    </div>
  );
};

export default PDFUploader; 