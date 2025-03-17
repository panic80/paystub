import Dexie from 'dexie';

// Create and initialize Dexie database
const db = new Dexie('paystubManager');

// Define schema with versioning
db.version(1).stores({
  individuals: '++id, name, address, phone_number, email',
  paystubs: '++id, individualId, name, date, filename, extractionDate, amount, company, fileData',
}).upgrade(tx => {
  console.log('Upgrading database schema...');
});

// Open database
db.open().catch(err => {
  console.error('Failed to open database:', err);
  throw new Error('Failed to initialize database. Please ensure your browser supports IndexedDB.');
});

// Database service
export const clientDb = {
  // Individual operations
  async getIndividuals() {
    const individuals = await db.individuals.toArray();
    
    // For each individual, calculate stats
    const individualsWithStats = await Promise.all(
      individuals.map(async (individual) => {
        const paystubs = await db.paystubs
          .where('individualId')
          .equals(individual.id)
          .toArray();
        
        const paystubCount = paystubs.length;
        const totalEarnings = paystubs.reduce((sum, paystub) => sum + (paystub.amount || 0), 0);
        
        return {
          ...individual,
          paystubCount,
          totalEarnings,
        };
      })
    );
    
    return individualsWithStats;
  },
  
  async getIndividualById(id) {
    const individual = await db.individuals.get(id);
    if (!individual) return null;
    
    const paystubs = await db.paystubs
      .where('individualId')
      .equals(individual.id)
      .toArray();
    
    const paystubCount = paystubs.length;
    const totalEarnings = paystubs.reduce((sum, paystub) => sum + (paystub.amount || 0), 0);
    
    return {
      ...individual,
      paystubCount,
      totalEarnings,
    };
  },
  
  async getOrCreateIndividual(name) {
    let individual = await db.individuals.where('name').equals(name).first();
    
    if (!individual) {
      const id = await db.individuals.add({
        name,
        address: '',
        phone_number: '',
        email: '',
      });
      individual = await db.individuals.get(id);
    }
    
    return individual;
  },
  
  async updateIndividualInfo(id, data) {
    await db.individuals.update(id, data);
    return this.getIndividualById(id);
  },
  
  // Paystub operations
  async getPaystubs(individualId = null) {
    if (individualId) {
      return db.paystubs
        .where('individualId')
        .equals(individualId)
        .reverse()
        .sortBy('date');
    } else {
      return db.paystubs.reverse().sortBy('date');
    }
  },
  
  async addPaystub(data) {
    // Extract name to ensure individual exists
    const individual = await this.getOrCreateIndividual(data.name);
    
    // Check if paystub already exists for this individual and date
    const existingPaystub = await db.paystubs
      .where('individualId')
      .equals(individual.id)
      .and(paystub => paystub.date === data.date)
      .first();
    
    if (existingPaystub) {
      console.log(`Paystub already exists for ${data.name} on ${data.date}. Skipping.`);
      return false;
    }
    
    // Add new paystub
    const paystubData = {
      individualId: individual.id,
      name: data.name,
      date: data.date,
      filename: data.filename,
      extractionDate: new Date().toISOString().split('T')[0],
      amount: data.amount || 0,
      company: data.company || 'Unknown Company',
      fileData: data.fileData,
    };
    
    const id = await db.paystubs.add(paystubData);
    console.log(`Added paystub for ${data.name}: ${data.filename}`);
    return id;
  },
  
  async deletePaystub(id) {
    await db.paystubs.delete(id);
    return true;
  },

  // PDF processing
  async processPdfs(results) {
    const processed = [];
    
    for (const result of results) {
      const paystubData = {
        name: result.name,
        date: result.date,
        filename: result.filename,
        amount: result.amount,
        company: result.company,
        fileData: result.pdfBytes,
      };
      
      const id = await this.addPaystub(paystubData);
      if (id) {
        processed.push(id);
      }
    }
    
    return processed;
  },
};
