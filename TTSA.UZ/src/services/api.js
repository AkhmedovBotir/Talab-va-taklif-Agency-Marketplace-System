import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Regions API
export const getRegions = async (params = {}) => {
  const response = await api.get('/regions', { params });
  return response.data;
};

// Partnership Request API
export const createPartnershipRequest = async (data) => {
  const response = await api.post('/marketplace/partnership-requests', data);
  return response.data;
};

export default api;


