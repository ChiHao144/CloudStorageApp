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
    },

    viewFileContent: (username: string, password: string, filepath: string) => {
        const u = encodeURIComponent(username);
        const p = encodeURIComponent(password);
        const f = encodeURIComponent(filepath);
        return api.get(`/file-content?username=${u}&password=${p}&path=${f}`);
    },

    getDownloadUrl: (username: string, password: string, filepath: string) => {
        const u = encodeURIComponent(username);
        const p = encodeURIComponent(password);
        const f = encodeURIComponent(filepath);
        return `${API_BASE_URL}/file-stream?username=${u}&password=${p}&path=${f}`;
    },

    getFilesFolder: (username: string, password: string, filepath: string) => {
        const u = encodeURIComponent(username);
        const p = encodeURIComponent(password);
        const f = encodeURIComponent(filepath);
        return api.get(`/list-dir?username=${u}&password=${p}&path=${f}`);
    },
    deleteFile: (username: string, password: string, filepath: string) => {
        const u = encodeURIComponent(username);
        const p = encodeURIComponent(password);
        const f = encodeURIComponent(filepath);
        return api.delete(`/delete?username=${u}&password=${p}&path=${f}`);
    },

    getDownloadLink: (username: string, password: string, filepath: string) => {
        const u = encodeURIComponent(username);
        const p = encodeURIComponent(password);
        const f = encodeURIComponent(filepath);
        return `${API_BASE_URL}/download?username=${u}&password=${p}&path=${f}`;
    },

    // --- THÊM MỚI CÁC HÀM DƯỚI ĐÂY ---

    // 1. Tạo link thanh toán MoMo
    createMomoPayment: (username: string, plan: string) => {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('plan', plan);
        
        return api.post('/payment/momo/create', formData);
    },

    // 2. Nâng cấp tài khoản (Gọi ở trang Callback)
    upgradeAccount: (username: string, plan: string) => {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('plan', plan);

        return api.post('/upgrade-account', formData);
    },
};

export default api;