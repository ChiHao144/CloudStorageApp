import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import Link from 'next/link';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        
        try {
            const res = await authApi.login(username, password);
            if (res.status === 200 && res.data.message) { 
                localStorage.setItem('password', password); 
                login(username);
                return;
            }
            setErrorMsg(res.data?.message || 'Đăng nhập thất bại.');
        } catch (err: unknown) { 
            let msg = 'Đăng nhập thất bại. Vui lòng kiểm tra tài khoản và mật khẩu.';
            
            if (typeof err === 'object' && err !== null && 'response' in err) {
                const response = (err as { response: { data?: { error?: string, msg?: string }, status?: number } }).response;
                if (response?.status === 401) {
                    msg = response.data?.error || response.data?.msg || 'Thông tin xác thực không hợp lệ (401).';
                } else if (response) {
                    msg = `Lỗi ${response.status}: ${response.data?.msg || response.data?.error}`;
                }
            }
            setErrorMsg(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[80vh] items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
                <div className="text-center">
                    <h2 className="mt-2 text-3xl font-extrabold text-gray-900">Đăng nhập</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Quản lý dữ liệu đám mây của bạn
                    </p>
                </div>

                {errorMsg && (
                    <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errorMsg}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Tên đăng nhập</label>
                            <input 
                                type="text"
                                value={username} 
                                onChange={e=>setUsername(e.target.value)} 
                                className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 sm:text-sm transition-all"
                                placeholder="Nhập username"
                                required 
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu</label>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={e=>setPassword(e.target.value)}
                                className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 sm:text-sm transition-all"
                                placeholder="••••••••"
                                required 
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="group relative flex w-full justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                    >
                        {loading ? <div className="loader w-5 h-5 border-2 border-white/30 border-t-white"></div> : 'Đăng nhập'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-600">
                    Chưa có tài khoản?{' '}
                    <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
                        Đăng ký ngay
                    </Link>
                </p>
            </div>
        </div>
    );
}