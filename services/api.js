import axios from 'axios';
const API_URL = ' http://10.209.122.174:5000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getProducts = async () => {
    try {
        const response = await api.get('/products');
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

export const getFields = async () => {
    try {
        const response = await api.get('/fields');
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