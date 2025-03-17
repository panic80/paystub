import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, PencilIcon, UserIcon, EnvelopeIcon, PhoneIcon, HomeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import DataTable from '../components/DataTable';
import IndividualForm from '../components/IndividualForm';
import { getIndividuals, updateIndividualInfo, deleteIndividual, getPayStatementCounts } from '../utils/databaseManager';

const IndividualsPage = () => {
  const [individuals, setIndividuals] = useState([]);
  const [statementCounts, setStatementCounts] = useState({});
  const [selectedIndividual, setSelectedIndividual] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // Load individuals and statement counts on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Get individuals
        const data = await getIndividuals();
        
        // Get pay statement counts
        const counts = await getPayStatementCounts();
        
        setIndividuals(data);
        setStatementCounts(counts);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleAddIndividual = () => {
    setSelectedIndividual(null);
    setShowForm(true);
  };

  const handleEditIndividual = (individual) => {
    setSelectedIndividual(individual);
    setShowForm(true);
  };

  const handleDeleteIndividual = async (individual) => {
    if (window.confirm(`Are you sure you want to delete ${individual.name}? This will also delete all associated pay statements.`)) {
      try {
        setDeleting(true);
        
        // Delete the individual from the database
        await deleteIndividual(individual.id);
        
        // Remove the individual from the UI
        setIndividuals(prevIndividuals => 
          prevIndividuals.filter(ind => ind.id !== individual.id)
        );
        
        // Update statement counts
        setStatementCounts(prevCounts => {
          const newCounts = { ...prevCounts };
          delete newCounts[individual.id];
          return newCounts;
        });
        
        // Show success message
        alert(`${individual.name} deleted successfully along with all associated pay statements.`);
      } catch (error) {
        console.error("Error deleting individual:", error);
        alert(`Error deleting individual: ${error.message}`);
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      setLoading(true);
      
      if (selectedIndividual) {
        // Update existing individual
        await updateIndividualInfo(selectedIndividual.id, formData);
        
        // Update the individuals list
        setIndividuals(prevIndividuals => 
          prevIndividuals.map(ind => 
            ind.id === selectedIndividual.id ? { ...ind, ...formData } : ind
          )
        );
      } else {
        // For adding a new individual, we would normally call an API
        // But since we're only adding individuals through PDF processing,
        // we'll just show a message
        alert("New individuals are added automatically when processing PDFs");
      }
      
      setShowForm(false);
      setSelectedIndividual(null);
    } catch (error) {
      console.error("Error saving individual:", error);
      alert(`Error saving individual: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedIndividual(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <div className="bg-blue-100 p-2 rounded-full mr-3 dark:bg-blue-900">
            <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Individuals</h1>
        </div>
        <button 
          onClick={handleAddIndividual}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center transition-colors duration-200 shadow-sm dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Individual
        </button>
      </div>
      
      {showForm ? (
        <div className="flex justify-center">
          <div className="card p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {selectedIndividual ? 'Edit Individual' : 'Add Individual'}
            </h2>
            <IndividualForm 
              individual={selectedIndividual}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          </div>
        </div>
      ) : (
        <>
          {loading ? (
            <div className="card p-6 text-center">
              <div className="animate-pulse flex flex-col items-center">
                <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-12 w-12 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-3"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-36"></div>
              </div>
              <p className="mt-4 text-gray-500 dark:text-gray-400">Loading individuals...</p>
            </div>
          ) : deleting ? (
            <div className="card p-6 text-center">
              <div className="animate-pulse flex flex-col items-center">
                <div className="rounded-full bg-red-100 dark:bg-red-900 p-3 mb-4">
                  <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-300" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">Deleting individual...</p>
              </div>
            </div>
          ) : (
            <div className="card overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg shadow">
              {individuals.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 w-1/4">
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-2" />
                            Name
                          </div>
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 w-1/4">
                          <div className="flex items-center">
                            <EnvelopeIcon className="h-4 w-4 mr-2" />
                            Email
                          </div>
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 w-1/6">
                          <div className="flex items-center">
                            <PhoneIcon className="h-4 w-4 mr-2" />
                            Phone
                          </div>
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 w-1/6">
                          <div className="flex items-center">
                            <HomeIcon className="h-4 w-4 mr-2" />
                            Address
                          </div>
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 w-20">
                          <div className="flex items-center">
                            <DocumentTextIcon className="h-4 w-4 mr-2" />
                            Docs
                          </div>
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 w-20">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                      {individuals.map((individual, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{individual.name}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {individual.email ? (
                                <a href={`mailto:${individual.email}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                                  {individual.email}
                                </a>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-600">Not provided</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {individual.phone || (
                                <span className="text-gray-400 dark:text-gray-600">Not provided</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                              {individual.address || (
                                <span className="text-gray-400 dark:text-gray-600">Not provided</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                              {statementCounts[individual.id] || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditIndividual(individual)}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Edit"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteIndividual(individual)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
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
              ) : (
                <div className="text-center py-12">
                  <UserIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No individuals found</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Upload a PDF to add individuals automatically.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={handleAddIndividual}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                      <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                      Add Manually
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default IndividualsPage; 