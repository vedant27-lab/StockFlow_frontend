import axios from 'axios';
const API_URL = ' http://10.209.122.174:5000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getDashboardStats = async () => {
    const response = await api.get('/dashboard');
    return response.data;
};
export const getFolders = async () => {
    const response = await api.get('/folders');
    return response.data;
};

export const createFolder = async (name) => {
    const response = await api.post('/folders', { name });
    return response.data;
} 

export const getProducts = async (folderId) => {
    try {
        const response = await api.get(`/products?folder_id=${folderId}`);
        return response.data;
    }catch(error) {
        console.error("Error fetching products:", error);
        throw error;
    }
};

export const createProduct = async (productData) => {
    try {
        const response = await api.post('/products', productData);
        return response.data;
    }catch (error) {
        console.error("Error creating product:", error);
        throw error;
    }
};

export const deleteProduct = async (id) => {
    try {
        const response = await api.delete(`/products/${id}`);
        return response.data;
    }catch (error) {
        console.error("Error deleting product:", error);
        throw error;
    }
};

export const getFields = async (folderId) => {
    try {
        const response = await api.get(`/fields?folder_id=${folderId}`);
        return response.data;
    }catch (error) {
        console.error("Error fetching fields:", error);
        throw error;
    }
};

export const createField = async (fieldData) => {
    try {
        const response = await api.post('/fields', fieldData);
        return response.data;
    }catch (error) {
        console.error("Error creating field:", error);
        throw error;
    }
};

export const updateProduct = async (id, productData) => {
    try {
        const response = await api.put(`/products/${id}`, productData);
        return response.data;
    }catch (error) {
        console.error("Error updating product:", error);
        throw error;
    }
};

export default api;