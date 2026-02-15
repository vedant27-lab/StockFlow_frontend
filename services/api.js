import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.77.100.174:5000';

const api = axios.create({ baseURL: API_URL });

// Add token to requests automatically
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- AUTHENTICATION ---
export const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  if (response.data.token) {
    await AsyncStorage.setItem('auth_token', response.data.token);
    await AsyncStorage.setItem('username', response.data.username);
  }
  return response.data;
};

export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (e) {
    console.error('Logout error:', e);
  } finally {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('username');
  }
};

export const verifyToken = async () => {
  try {
    const response = await api.get('/auth/verify');
    return response.data;
  } catch (e) {
    return { valid: false };
  }
};

export const isAuthenticated = async () => {
  const token = await AsyncStorage.getItem('auth_token');
  if (!token) return false;

  const verification = await verifyToken();
  return verification.valid;
};

export const getUsername = async () => {
  return await AsyncStorage.getItem('username');
};

// --- ANALYTICS ---
export const getAvailableMetrics = async () => {
  const response = await api.get('/analytics/metrics');
  return response.data;
};
export const getChartData = async (metricName) => {
  const response = await api.get(`/analytics/data?metric=${metricName}`);
  return response.data;
};
export const saveMetricPreference = async (metric) => {
  await AsyncStorage.setItem('selected_metric', metric);
};
export const getMetricPreference = async () => {
  return await AsyncStorage.getItem('selected_metric');
};

// --- FOLDERS ---
export const getFolders = async () => (await api.get('/folders')).data;
export const createFolder = async (name) => (await api.post('/folders', { name })).data;
export const updateFolder = async (id, name) => {
  await api.put(`/folders/${id}`, { name });
};
export const deleteFolder = async (id) => {
  await api.delete(`/folders/${id}`);
};

// --- FIELDS ---
export const getFields = async (folderId) => (await api.get(`/fields?folder_id=${folderId}`)).data;
export const createField = async (data) => (await api.post('/fields', data)).data;
export const updateField = async (id, name) => {
  await api.put(`/fields/${id}`, { name });
};
export const deleteField = async (id) => {
  await api.delete(`/fields/${id}`);
};

// --- PRODUCTS ---
export const getProducts = async (folderId) => (await api.get(`/products?folder_id=${folderId}`)).data;
export const createProduct = async (data) => (await api.post('/products', data)).data;
export const updateProduct = async (id, data) => {
  await api.put(`/products/${id}`, data);
};
export const deleteProduct = async (id) => {
  await api.delete(`/products/${id}`);
};

// Folder-specific analytics
export const getFolderMetrics = async (folderId) => {
  const response = await api.get(`/analytics/folder/${folderId}/metrics`);
  return response.data;
};

export const getFolderChartData = async (folderId, metricName) => {
  const response = await api.get(`/analytics/folder/${folderId}/data?metric=${metricName}`);
  return response.data;
};

export default api;
