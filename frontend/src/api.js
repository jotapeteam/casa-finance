import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('cf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cf_token');
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

export const getTransactions = (params) => api.get('/transactions', { params }).then(r => r.data);
export const createTransaction = (data) => api.post('/transactions', data).then(r => r.data);
export const updateTransaction = (id, data) => api.put(`/transactions/${id}`, data).then(r => r.data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`).then(r => r.data);
export const getSummary = (params) => api.get('/summary', { params }).then(r => r.data);
export const getMonthlyEvolution = () => api.get('/summary/monthly-evolution').then(r => r.data);

export const getRecurring = () => api.get('/recurring').then(r => r.data);
export const getRecurringPreview = (params) => api.get('/recurring/preview', { params }).then(r => r.data);
export const createRecurring = (data) => api.post('/recurring', data).then(r => r.data);
export const updateRecurring = (id, data) => api.put(`/recurring/${id}`, data).then(r => r.data);
export const deleteRecurring = (id) => api.delete(`/recurring/${id}`).then(r => r.data);
export const confirmRecurring = (id, params) => api.post(`/recurring/${id}/confirm`, null, { params }).then(r => r.data);
