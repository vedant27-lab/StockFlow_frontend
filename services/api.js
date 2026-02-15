import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
const API_URL = 'http://10.77.100.174:5000'; 

const api = axios.create({ baseURL: API_URL });
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
export const getFolders = async () => (await api.get('/folders')).data;
export const createFolder = async (name) => (await api.post('/folders', { name })).data;
export const getFields = async (folderId) => (await api.get(`/fields?folder_id=${folderId}`)).data;
export const createField = async (data) => (await api.post('/fields', data)).data;
export const getProducts = async (folderId) => (await api.get(`/products?folder_id=${folderId}`)).data;
export const createProduct = async (data) => (await api.post('/products', data)).data;

export const updateFolder = async (id, name) => {
  await api.put(`/folders/${id}`, { name });
};

export const updateField = async (id, name) => {
  await api.put(`/fields/${id}`, { name });
};

export const deleteProduct = async (id, name) => {
  await api.put(`/delete/${id}`, { name });
};

export const deleteFields = async (id, name) => {
  await api.delete(`fields/${id}`);
};

export default api;