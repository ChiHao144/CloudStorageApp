// src/services/api.ts
// MOCK API để test giao diện
export const authApi = {
    register: (u: string, p: string) => 
        new Promise((resolve) => setTimeout(() => resolve({ data: { status: 'success' } }), 1000)),
    
    login: (u: string, p: string) => 
        new Promise((resolve) => {
            // Giả lập đăng nhập thành công sau 1 giây
            setTimeout(() => resolve({ 
                data: { status: 'success', token: 'fake-jwt-token-123' } 
            }), 1000);
        }),
};

export const userApi = {
    getUsage: (u: string) => 
        new Promise((resolve) => setTimeout(() => resolve({ 
            data: { used: 524288000, quota: 5368709120 } // 500MB / 5GB
        }), 500)),
    
    uploadFile: (formData: any) => 
        new Promise((resolve) => setTimeout(() => resolve({ data: { status: 'success' } }), 2000)),
};