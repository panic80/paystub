import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // We'll create this Python Flask backend

export const databaseService = {
  // Individual operations
  async getIndividuals() {
    const response = await axios.get(`${API_BASE_URL}/individuals`);
    return response.data;
  },

  async updateIndividualInfo(name, data) {
    const response = await axios.put(`${API_BASE_URL}/individuals/${encodeURIComponent(name)}`, data);
    return response.data;
  },

  // Paystub operations
  async getPaystubs(individualId = null) {
    const url = individualId 
      ? `${API_BASE_URL}/pay-statements/${individualId}`
      : `${API_BASE_URL}/pay-statements`;
    const response = await axios.get(url);
    return response.data;
  },

  async savePaystub(data) {
    const response = await axios.post(`${API_BASE_URL}/pay-statements`, data);
    return response.data;
  },

  async deletePaystub(id) {
    const response = await axios.delete(`${API_BASE_URL}/pay-statements/${id}`);
    return response.data;
  },

  // Process PDF and save to database
  async processPdfAndSave(pdfData, filename) {
    const formData = new FormData();
    formData.append('pdf', new Blob([pdfData], { type: 'application/pdf' }), filename);
    
    const response = await axios.post(`${API_BASE_URL}/process-pdf`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
}; 