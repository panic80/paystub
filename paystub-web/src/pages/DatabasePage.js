import React, { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import { UserIcon, DocumentTextIcon, CurrencyDollarIcon, CalendarIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getIndividuals, getPayStatements, getAllPayStatements, deletePayStatement } from '../utils/databaseManager';

/**
 * Format a date string to a more readable format
 * @param {string} dateStr - ISO format date string (YYYY-MM-DD)
 * @returns {string} Formatted date
 */
const formatDate = (dateStr) => {
  if (!dateStr || dateStr === "Unknown_Date") return "Unknown Date";
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr; // Return original if invalid
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateStr;
  }
};

const DatabasePage = () => {
  const [individuals, setIndividuals] = useState([]);
  const [selectedIndividual, setSelectedIndividual] = useState(null);
  const [payStatements, setPayStatements] = useState([]);
  const [stats, setStats] = useState({
    totalIndividuals: 0,
    totalStatements: 0,
    totalAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Get all individuals
        const individualsData = await getIndividuals();
        setIndividuals(individualsData);
        
        // Get all pay statements for stats
        const allStatements = await getAllPayStatements();
        
        // Calculate stats
        setStats({
          totalIndividuals: individualsData.length,
          totalStatements: allStatements.length,
          // In a real app, you would have an amount field in the pay statements
          totalAmount: allStatements.reduce((sum, statement) => sum + (statement.amount || 0), 0)
        });
        
        // If no individual is selected, don't show any statements
        if (!selectedIndividual) {
          setPayStatements([]);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [selectedIndividual]);

  const handleIndividualSelect = async (individual) => {
    setSelectedIndividual(individual);
    
    try {
      setLoading(true);
      
      // Get pay statements for the selected individual
      const statements = await getPayStatements(individual.id);
      
      // Sort statements by date (newest first)
      const sortedStatements = [...statements].sort((a, b) => {
        // Handle unknown dates
        if (a.date === "Unknown_Date") return 1;
        if (b.date === "Unknown_Date") return -1;
        // Sort by date, descending
        return new Date(b.date) - new Date(a.date);
      });
      
      setPayStatements(sortedStatements);
    } catch (error) {
      console.error("Error loading pay statements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStatement = (statement) => {
    // Create a blob from the PDF bytes and open it
    if (statement.pdfBytes) {
      const blob = new Blob([statement.pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } else {
      alert(`Cannot view statement: ${statement.filename} - PDF data not available`);
    }
  };

  const handleExportStatement = (statement) => {
    // Create a blob from the PDF bytes and download it
    if (statement.pdfBytes) {
      const blob = new Blob([statement.pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = statement.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert(`Cannot export statement: ${statement.filename} - PDF data not available`);
    }
  };

  const handleDeleteStatement = async (statement) => {
    if (window.confirm(`Are you sure you want to delete this pay statement for ${statement.date}?`)) {
      try {
        setDeleting(true);
        
        // Delete the statement from the database
        await deletePayStatement(statement.id);
        
        // Remove the statement from the UI
        setPayStatements(prev => prev.filter(s => s.id !== statement.id));
        
        // Update stats
        setStats(prev => ({
          ...prev,
          totalStatements: prev.totalStatements - 1
        }));
        
        // Show success message
        alert(`Pay statement deleted successfully`);
      } catch (error) {
        console.error("Error deleting pay statement:", error);
        alert(`Error deleting pay statement: ${error.message}`);
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleViewAllStatements = async () => {
    setSelectedIndividual(null);
    
    try {
      setLoading(true);
      
      // Get all pay statements
      const allStatements = await getAllPayStatements();
      
      // Sort statements by date (newest first)
      const sortedStatements = [...allStatements].sort((a, b) => {
        // Handle unknown dates
        if (a.date === "Unknown_Date") return 1;
        if (b.date === "Unknown_Date") return -1;
        // Sort by date, descending
        return new Date(b.date) - new Date(a.date);
      });
      
      setPayStatements(sortedStatements);
    } catch (error) {
      console.error("Error loading all pay statements:", error);
    } finally {
      setLoading(false);
    }
  };

  const individualColumns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' }
  ];

  const statementColumns = [
    { key: 'date', label: 'Date' },
    { key: 'filename', label: 'Filename' }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Database Viewer</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card flex items-center p-6">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3 mr-4">
            <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Individuals</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalIndividuals}</p>
          </div>
        </div>
        
        <div className="card flex items-center p-6">
          <div className="rounded-full bg-green-100 dark:bg-green-900 p-3 mr-4">
            <DocumentTextIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Statements</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStatements}</p>
          </div>
        </div>
        
        <div className="card flex items-center p-6">
          <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-3 mr-4">
            <CurrencyDollarIcon className="h-6 w-6 text-purple-600 dark:text-purple-300" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${stats.totalAmount.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Individuals Table */}
        <div className="lg:col-span-1">
          {loading && !selectedIndividual ? (
            <div className="card p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">Loading individuals...</p>
            </div>
          ) : (
            <DataTable
              data={individuals}
              columns={individualColumns}
              title="Individuals"
              onViewItem={handleIndividualSelect}
              onExportItem={() => {}}
            />
          )}
        </div>
        
        {/* Pay Statements Table */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedIndividual 
                  ? `Pay Statements for ${selectedIndividual.name}` 
                  : 'All Pay Statements'}
              </h2>
              <button 
                onClick={handleViewAllStatements}
                className="btn btn-secondary text-sm"
              >
                View All
              </button>
            </div>
            
            {loading && selectedIndividual ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Loading pay statements...
              </div>
            ) : deleting ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Deleting pay statement...
              </div>
            ) : payStatements.length > 0 ? (
              <div>
                <div className="table-container">
                  <table className="table">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell">Pay Date</th>
                        <th className="table-header-cell">Filename</th>
                        <th className="table-header-cell">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="table-body">
                      {payStatements.map((statement, index) => (
                        <tr key={index} className="table-row">
                          <td className="table-cell">
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                              <span className="font-medium text-gray-900 dark:text-white">{formatDate(statement.date)}</span>
                            </div>
                          </td>
                          <td className="table-cell">{statement.filename}</td>
                          <td className="table-cell">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleViewStatement(statement)}
                                className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                title="View"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleExportStatement(statement)}
                                className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                                title="Export"
                              >
                                Export
                              </button>
                              <button
                                onClick={() => handleDeleteStatement(statement)}
                                className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                title="Delete"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {selectedIndividual 
                  ? `No pay statements found for ${selectedIndividual.name}` 
                  : 'Select an individual to view their pay statements'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabasePage; 