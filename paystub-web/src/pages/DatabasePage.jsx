import React, { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import { UserIcon, DocumentTextIcon, CurrencyDollarIcon, CalendarIcon, TrashIcon } from '@heroicons/react/24/outline';
import {
  getIndividuals,
  getPayStatements,
  getAllPayStatements,
  deletePayStatement,
  getPayStatementWithPdf,
  downloadPayStatementPdf
} from '../utils/databaseManager';

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
  const [groupedStatements, setGroupedStatements] = useState({});
  const [expandedGroups, setExpandedGroups] = useState(new Set());
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
        
        // Get all individuals and sort by name
        const individualsData = await getIndividuals();
        // Get all pay statements and calculate stats
        const allStatements = await getAllPayStatements();
        
        // Sort individuals by name
        const sortedIndividuals = [...individualsData].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        
        // Create map of individual IDs to names
        const individualMap = new Map(
          sortedIndividuals.map(individual => [individual.id, individual.name])
        );
        
        // Group and sort statements by individual
        const grouped = allStatements.reduce((acc, statement) => {
          const individualName = individualMap.get(statement.individualId) || 'Unknown Individual';
          if (!acc[individualName]) {
            acc[individualName] = [];
          }
          acc[individualName].push(statement);
          return acc;
        }, {});
        
        // Sort statements within each group and create sorted object
        const sortedGrouped = Object.keys(grouped)
          .sort((a, b) => a.localeCompare(b))
          .reduce((acc, name) => {
            // Sort statements by date
            grouped[name].sort((a, b) => {
              if (a.date === "Unknown_Date") return 1;
              if (b.date === "Unknown_Date") return -1;
              return new Date(b.date) - new Date(a.date);
            });
            acc[name] = grouped[name];
            return acc;
          }, {});
        
        setIndividuals(sortedIndividuals);
        setGroupedStatements(sortedGrouped);
        // Calculate stats
        setStats({
          totalIndividuals: sortedIndividuals.length,
          totalStatements: allStatements.length,
          totalAmount: allStatements.reduce((sum, statement) => sum + (statement.amount || 0), 0)
        });
        
        // Show all statements if no individual is selected
        if (!selectedIndividual) {
          setPayStatements(allStatements);
          setExpandedGroups(new Set([...Object.keys(sortedGrouped)])); // Expand all groups by default
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

  const handleViewStatement = async (statement) => {
    try {
      const fullStatement = await getPayStatementWithPdf(statement.id);
      if (!fullStatement.fileData) {
        throw new Error('PDF data not available');
      }

      const blob = new Blob([fullStatement.fileData], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      URL.revokeObjectURL(url); // Clean up
    } catch (error) {
      console.error("Error viewing statement:", error);
      alert(`Cannot view statement: ${statement.filename} - ${error.message}`);
    }
  };

  const handleExportStatement = async (statement) => {
    try {
      await downloadPayStatementPdf(statement.id);
    } catch (error) {
      console.error("Error exporting statement:", error);
      alert(`Cannot export statement: ${statement.filename} - ${error.message}`);
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
        // Update stats and groupings after deletion
        setStats(prev => ({
          ...prev,
          totalStatements: prev.totalStatements - 1,
          totalAmount: prev.totalAmount - (statement.amount || 0)
        }));

        // Remove from grouped statements if we're in the "View All" mode
        if (!selectedIndividual) {
          const individualName = Object.keys(groupedStatements).find(
            name => groupedStatements[name].some(s => s.id === statement.id)
          );
          
          if (individualName) {
            const updatedGroups = { ...groupedStatements };
            updatedGroups[individualName] = updatedGroups[individualName].filter(
              s => s.id !== statement.id
            );
            
            // Remove empty groups
            if (updatedGroups[individualName].length === 0) {
              delete updatedGroups[individualName];
              setExpandedGroups(prev => {
                const newSet = new Set(prev);
                newSet.delete(individualName);
                return newSet;
              });
            }
            
            setGroupedStatements(updatedGroups);
          }
        }
        
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
      
      // Get all pay statements and individuals
      const [allStatements, allIndividuals] = await Promise.all([
        getAllPayStatements(),
        getIndividuals()
      ]);

      // Create map of individual IDs to names
      const individualMap = new Map(
        allIndividuals.map(individual => [individual.id, individual.name])
      );

      // Group and sort statements by individual
      const grouped = allStatements.reduce((acc, statement) => {
        const individualName = individualMap.get(statement.individualId) || 'Unknown Individual';
        if (!acc[individualName]) {
          acc[individualName] = [];
        }
        acc[individualName].push(statement);
        return acc;
      }, {});

      // Sort statements within each group by date and create sorted object
      const sortedGrouped = Object.keys(grouped)
        .sort((a, b) => a.localeCompare(b))
        .reduce((acc, name) => {
          // Sort statements by date
          grouped[name].sort((a, b) => {
            if (a.date === "Unknown_Date") return 1;
            if (b.date === "Unknown_Date") return -1;
            return new Date(b.date) - new Date(a.date);
          });
          acc[name] = grouped[name];
          return acc;
        }, {});

      setGroupedStatements(sortedGrouped);
      setPayStatements(allStatements);
      setExpandedGroups(new Set([...Object.keys(grouped)])); // Expand all groups by default
    } catch (error) {
      console.error("Error loading all pay statements:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
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
            
            {loading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Loading pay statements...
              </div>
            ) : deleting ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Deleting pay statement...
              </div>
            ) : (
              <DataTable
                data={selectedIndividual ? payStatements : []}
                groupedData={selectedIndividual ? {} : groupedStatements}
                isGrouped={!selectedIndividual}
                columns={[
                  { key: 'date', label: 'Pay Date' },
                  { key: 'filename', label: 'Filename' }
                ]}
                title={selectedIndividual ? `Pay Statements for ${selectedIndividual.name}` : 'All Pay Statements'}
                onViewItem={handleViewStatement}
                onExportItem={handleExportStatement}
                onDeleteItem={handleDeleteStatement}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabasePage;
