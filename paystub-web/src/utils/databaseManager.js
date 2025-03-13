/**
 * Database manager for the Paystub application using IndexedDB
 */

const DB_NAME = 'paystub_db';
const DB_VERSION = 1;

/**
 * Initialize the database
 * @returns {Promise<IDBDatabase>} The database instance
 */
export const initDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error("Database error:", event.target.error);
      reject(event.target.error);
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create individuals store with name as key path
      if (!db.objectStoreNames.contains('individuals')) {
        const individualsStore = db.createObjectStore('individuals', { keyPath: 'id', autoIncrement: true });
        individualsStore.createIndex('name', 'name', { unique: true });
      }
      
      // Create pay statements store
      if (!db.objectStoreNames.contains('pay_statements')) {
        const statementsStore = db.createObjectStore('pay_statements', { keyPath: 'id', autoIncrement: true });
        statementsStore.createIndex('individual_id', 'individualId', { unique: false });
        statementsStore.createIndex('individual_date', ['individualId', 'date'], { unique: true });
      }
    };
  });
};

/**
 * Insert a new individual into the database
 * @param {Object} individual - The individual to insert
 * @returns {Promise<number>} The ID of the inserted individual
 */
export const insertIndividual = async (individual) => {
  const db = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['individuals'], 'readwrite');
    const store = transaction.objectStore('individuals');
    
    // Check if individual already exists
    const nameIndex = store.index('name');
    const getRequest = nameIndex.get(individual.name);
    
    getRequest.onsuccess = (event) => {
      if (event.target.result) {
        // Individual already exists, return existing ID
        resolve(event.target.result.id);
      } else {
        // Insert new individual
        const addRequest = store.add(individual);
        
        addRequest.onsuccess = (event) => {
          resolve(event.target.result);
        };
        
        addRequest.onerror = (event) => {
          console.error("Error adding individual:", event.target.error);
          reject(event.target.error);
        };
      }
    };
    
    getRequest.onerror = (event) => {
      console.error("Error checking individual:", event.target.error);
      reject(event.target.error);
    };
  });
};

/**
 * Insert a pay statement into the database
 * @param {Object} statement - The pay statement to insert
 * @returns {Promise<boolean>} Whether the statement was inserted
 */
export const insertPayStatement = async (statement) => {
  const db = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pay_statements'], 'readwrite');
    const store = transaction.objectStore('pay_statements');
    
    // Check if statement already exists for this individual and date
    const index = store.index('individual_date');
    const getRequest = index.get([statement.individualId, statement.date]);
    
    getRequest.onsuccess = (event) => {
      if (event.target.result) {
        // Statement already exists
        console.log(`Pay statement already exists for individual ${statement.individualId} on ${statement.date}`);
        resolve(false);
      } else {
        // Add extraction date
        const statementWithDate = {
          ...statement,
          extractionDate: new Date().toISOString().split('T')[0]
        };
        
        // Insert new statement
        const addRequest = store.add(statementWithDate);
        
        addRequest.onsuccess = () => {
          console.log(`Inserted new pay statement for ${statement.individualId}: ${statement.filename}`);
          resolve(true);
        };
        
        addRequest.onerror = (event) => {
          console.error("Error adding pay statement:", event.target.error);
          reject(event.target.error);
        };
      }
    };
    
    getRequest.onerror = (event) => {
      console.error("Error checking pay statement:", event.target.error);
      reject(event.target.error);
    };
  });
};

/**
 * Update individual information
 * @param {number} id - The individual's ID
 * @param {Object} updates - The fields to update
 * @returns {Promise<boolean>} Whether the update was successful
 */
export const updateIndividualInfo = async (id, updates) => {
  const db = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['individuals'], 'readwrite');
    const store = transaction.objectStore('individuals');
    
    // Get the current individual
    const getRequest = store.get(id);
    
    getRequest.onsuccess = (event) => {
      const individual = event.target.result;
      
      if (!individual) {
        reject(new Error(`Individual with ID ${id} not found`));
        return;
      }
      
      // Update fields
      const updatedIndividual = { ...individual, ...updates };
      
      // Put back the updated individual
      const putRequest = store.put(updatedIndividual);
      
      putRequest.onsuccess = () => {
        console.log(`Updated information for individual ${id}`);
        resolve(true);
      };
      
      putRequest.onerror = (event) => {
        console.error("Error updating individual:", event.target.error);
        reject(event.target.error);
      };
    };
    
    getRequest.onerror = (event) => {
      console.error("Error getting individual:", event.target.error);
      reject(event.target.error);
    };
  });
};

/**
 * Get all individuals
 * @returns {Promise<Array>} Array of individuals
 */
export const getIndividuals = async () => {
  const db = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['individuals'], 'readonly');
    const store = transaction.objectStore('individuals');
    const request = store.getAll();
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onerror = (event) => {
      console.error("Error getting individuals:", event.target.error);
      reject(event.target.error);
    };
  });
};

/**
 * Get pay statements for an individual
 * @param {number} individualId - The individual's ID
 * @returns {Promise<Array>} Array of pay statements
 */
export const getPayStatements = async (individualId) => {
  const db = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pay_statements'], 'readonly');
    const store = transaction.objectStore('pay_statements');
    const index = store.index('individual_id');
    const request = index.getAll(individualId);
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onerror = (event) => {
      console.error("Error getting pay statements:", event.target.error);
      reject(event.target.error);
    };
  });
};

/**
 * Get all pay statements
 * @returns {Promise<Array>} Array of all pay statements
 */
export const getAllPayStatements = async () => {
  const db = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pay_statements'], 'readonly');
    const store = transaction.objectStore('pay_statements');
    const request = store.getAll();
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onerror = (event) => {
      console.error("Error getting all pay statements:", event.target.error);
      reject(event.target.error);
    };
  });
};

/**
 * Delete a pay statement by ID
 * @param {number} id - The ID of the pay statement to delete
 * @returns {Promise<boolean>} Whether the delete was successful
 */
export const deletePayStatement = async (id) => {
  const db = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pay_statements'], 'readwrite');
    const store = transaction.objectStore('pay_statements');
    
    const request = store.delete(id);
    
    request.onsuccess = () => {
      console.log(`Deleted pay statement with ID ${id}`);
      resolve(true);
    };
    
    request.onerror = (event) => {
      console.error("Error deleting pay statement:", event.target.error);
      reject(event.target.error);
    };
  });
};

/**
 * Delete an individual by ID and all their associated pay statements
 * @param {number} id - The ID of the individual to delete
 * @returns {Promise<boolean>} Whether the delete was successful
 */
export const deleteIndividual = async (id) => {
  const db = await initDatabase();
  
  return new Promise((resolve, reject) => {
    try {
      // Use a transaction to ensure both delete operations are atomic
      const transaction = db.transaction(['individuals', 'pay_statements'], 'readwrite');
      
      // Delete the individual
      const individualStore = transaction.objectStore('individuals');
      const deleteIndividualRequest = individualStore.delete(id);
      
      // Delete all associated pay statements
      const statementsStore = transaction.objectStore('pay_statements');
      const index = statementsStore.index('individual_id');
      const getStatementsRequest = index.getAll(id);
      
      getStatementsRequest.onsuccess = () => {
        const statements = getStatementsRequest.result;
        
        // Delete each statement
        let deletedCount = 0;
        if (statements.length === 0) {
          // No statements to delete, transaction will complete
          console.log(`Deleted individual with ID ${id} (no statements found)`);
        } else {
          for (const statement of statements) {
            const deleteStatementRequest = statementsStore.delete(statement.id);
            
            deleteStatementRequest.onsuccess = () => {
              deletedCount++;
              if (deletedCount === statements.length) {
                console.log(`Deleted individual with ID ${id} and ${deletedCount} pay statements`);
              }
            };
            
            deleteStatementRequest.onerror = (event) => {
              console.error(`Error deleting statement ${statement.id}:`, event.target.error);
            };
          }
        }
      };
      
      getStatementsRequest.onerror = (event) => {
        console.error("Error getting statements for individual:", event.target.error);
      };
      
      transaction.oncomplete = () => {
        resolve(true);
      };
      
      transaction.onerror = (event) => {
        console.error("Transaction error:", event.target.error);
        reject(event.target.error);
      };
    } catch (error) {
      console.error("Error in deleteIndividual:", error);
      reject(error);
    }
  });
};

/**
 * Get count of pay statements for each individual
 * @returns {Promise<Object>} Object with individual IDs as keys and counts as values
 */
export const getPayStatementCounts = async () => {
  const db = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pay_statements'], 'readonly');
    const store = transaction.objectStore('pay_statements');
    const request = store.getAll();
    
    request.onsuccess = (event) => {
      const statements = event.target.result;
      const counts = {};
      
      // Count statements for each individual
      statements.forEach(statement => {
        const individualId = statement.individualId;
        counts[individualId] = (counts[individualId] || 0) + 1;
      });
      
      resolve(counts);
    };
    
    request.onerror = (event) => {
      console.error("Error getting pay statement counts:", event.target.error);
      reject(event.target.error);
    };
  });
}; 