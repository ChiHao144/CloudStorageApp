import axios from 'axios';


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("API Error:", error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export const authApi = {
    register: (username: string, password: string) => {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        return api.post('/register', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
    },

    login: (username: string, password: string) => {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        return api.post('/login', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
    },
};

export const userApi = {
    getUsage: (username: string) =>
        api.get(`/usage?username=${username}`),

    uploadFile: (file: File, username: string, password: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('username', username);
        formData.append('password', password); 

        return api.post('/upload', formData, {
        });
    },

    makePayment: (username: string, amount: number) => {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('amount', amount.toString()); 
        
        return api.post('/payment', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
    },
    
    getQuota: (username: string, password: string) => {
        
        return api.get(`/quota?username=${username}&password=${password}`);
    },

    
    getFiles: (username: string, password: string, path: string = "") => {
        
        const encodedPath = encodeURIComponent(path);
        return api.get(`/files?username=${username}&password=${password}&path=${encodedPath}`);
    }
};

export default api;