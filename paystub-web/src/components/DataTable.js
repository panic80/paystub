import React, { useState } from 'react';
import { MagnifyingGlassIcon, ArrowDownTrayIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/outline';

const DataTable = ({ 
  data, 
  columns, 
  title, 
  onViewItem, 
  onExportItem, 
  onDeleteItem,
  groupedData,
  isGrouped = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // Filter and sort regular data
  const processedData = React.useMemo(() => {
    if (isGrouped) return {}; // Don't process if using grouped data

    let filteredItems = data.filter(item => {
      return Object.values(item).some(value => 
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    if (sortConfig.key) {
      filteredItems.sort((a, b) => {
        const aValue = a[sortConfig.key]?.toString() || '';
        const bValue = b[sortConfig.key]?.toString() || '';
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return filteredItems;
  }, [data, searchTerm, sortConfig, isGrouped]);

  // Filter grouped data
  const processedGroupedData = React.useMemo(() => {
    if (!isGrouped) return {};

    return Object.entries(groupedData).reduce((acc, [groupName, items]) => {
      // Filter items in each group
      const filteredItems = items.filter(item =>
        Object.values(item).some(value =>
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );

      // Only include groups with matching items
      if (filteredItems.length > 0) {
        acc[groupName] = filteredItems;
      }
      return acc;
    }, {});
  }, [groupedData, searchTerm, isGrouped]);

  const requestSort = key => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
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

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="input pl-10"
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              {columns.map(column => (
                <th 
                  key={column.key} 
                  className="table-header-cell cursor-pointer"
                  onClick={() => requestSort(column.key)}
                >
                  <div className="flex items-center">
                    {column.label}
                    {sortConfig.key === column.key && (
                      <span className="ml-1">
                        {sortConfig.direction === 'ascending' ? '?' : '?'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              <th className="table-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {isGrouped ? (
              // Grouped data display
              Object.entries(processedGroupedData).length > 0 ? (
                Object.entries(processedGroupedData).map(([groupName, items]) => (
                  <React.Fragment key={groupName}>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <td colSpan={columns.length + 1} className="table-cell">
                        <button
                          onClick={() => toggleGroup(groupName)}
                          className="flex items-center w-full font-semibold text-left"
                        >
                          <span className="mr-2">
                            {expandedGroups.has(groupName) ? '?' : '?'}
                          </span>
                          {groupName} ({items.length} items)
                        </button>
                      </td>
                    </tr>
                    {expandedGroups.has(groupName) && items.map((item, index) => (
                      <tr key={`${groupName}-${index}`} className="table-row">
                        {columns.map(column => (
                          <td key={column.key} className="table-cell pl-8">
                            {item[column.key]}
                          </td>
                        ))}
                        <td className="table-cell">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => onViewItem(item)}
                              className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              title="View"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => onExportItem(item)}
                              className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                              title="Export"
                            >
                              <ArrowDownTrayIcon className="h-5 w-5" />
                            </button>
                            {onDeleteItem && (
                              <button
                                onClick={() => onDeleteItem(item)}
                                className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                title="Delete"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length + 1} className="table-cell text-center py-8 text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'No results found' : 'No data available'}
                  </td>
                </tr>
              )
            ) : (
              // Regular data display
              processedData.length > 0 ? (
                processedData.map((item, index) => (
                  <tr key={index} className="table-row">
                    {columns.map(column => (
                      <td key={column.key} className="table-cell">
                        {item[column.key]}
                      </td>
                    ))}
                    <td className="table-cell">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onViewItem(item)}
                          className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          title="View"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => onExportItem(item)}
                          className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                          title="Export"
                        >
                          <ArrowDownTrayIcon className="h-5 w-5" />
                        </button>
                        {onDeleteItem && (
                          <button
                            onClick={() => onDeleteItem(item)}
                            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length + 1} className="table-cell text-center py-8 text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'No results found' : 'No data available'}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        {isGrouped ? (
          `Showing ${Object.values(processedGroupedData).reduce((sum, items) => sum + items.length, 0)} of ${
            Object.values(groupedData).reduce((sum, items) => sum + items.length, 0)
          } entries`
        ) : (
          `Showing ${processedData.length} of ${data.length} entries`
        )}
      </div>
    </div>
  );
};

export default DataTable;
