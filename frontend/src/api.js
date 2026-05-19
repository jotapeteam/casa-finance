import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const getTransactions = (params) => api.get('/transactions', { params }).then(r => r.data);
export const createTransaction = (data) => api.post('/transactions', data).then(r => r.data);
export const updateTransaction = (id, data) => api.put(`/transactions/${id}`, data).then(r => r.data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`).then(r => r.data);
export const getSummary = (params) => api.get('/summary', { params }).then(r => r.data);
export const getMonthlyEvolution = () => api.get('/summary/monthly-evolution').then(r => r.data);
