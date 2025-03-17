import React, { useState, useEffect } from 'react';
import { EnvelopeIcon, PhoneIcon, HomeIcon, UserIcon } from '@heroicons/react/24/outline';

const IndividualForm = ({ individual, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // Initialize form with individual data if provided
  useEffect(() => {
    if (individual) {
      setFormData({
        name: individual.name || '',
        email: individual.email || '',
        phone: individual.phone || '',
        address: individual.address || ''
      });
    }
  }, [individual]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="space-y-5">
        <div>
          <label htmlFor="name" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Full Name"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
            required
            disabled={individual} // Name cannot be changed if editing an existing individual
          />
          {individual && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Name cannot be changed as it is used as a unique identifier.
            </p>
          )}
        </div>
        
        <div>
          <label htmlFor="email" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-500" />
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email Address"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
          />
        </div>
        
        <div>
          <label htmlFor="phone" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <PhoneIcon className="h-4 w-4 mr-2 text-gray-500" />
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone Number"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
          />
        </div>
        
        <div>
          <label htmlFor="address" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <HomeIcon className="h-4 w-4 mr-2 text-gray-500" />
            Address
          </label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Mailing Address"
            rows="3"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
          ></textarea>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {individual ? 'Update' : 'Add'}
        </button>
      </div>
    </form>
  );
};

export default IndividualForm; 