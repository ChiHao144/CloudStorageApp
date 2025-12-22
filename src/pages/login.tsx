import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import Swal from 'sweetalert2';
import Link from 'next/link';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await authApi.login(username, password);
            if (res.status === 200 && res.data.message) {
                localStorage.setItem('password', password);

                await Swal.fire({
                    icon: 'success',
                    title: 'Đăng nhập thành công!',
                    text: 'Chào mừng bạn quay trở lại.',
                    timer: 2000,
                    showConfirmButton: false
                });

                login(username);
                return;
            }

            Swal.fire({
                icon: 'error',
                title: 'Đăng nhập thất bại',
                text: res.data?.message || 'Có lỗi xảy ra.',
            });

        } catch (err: unknown) {
            let msg = 'Đăng nhập thất bại.';
            if (typeof err === 'object' && err !== null && 'response' in err) {
                const response = (err as { response: { data?: { error?: string, msg?: string }, status?: number } }).response;
                if (response?.status === 401) msg = 'Sai tài khoản hoặc mật khẩu.';
                else if (response) msg = msg = `Lỗi ${response.status}: ${response.data?.msg || response.data?.error}`;
            }

            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: msg,
            });
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

                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Tên đăng nhập</label>
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 sm:text-sm transition-all"
                                placeholder="Nhập username"
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu</label>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"} // Chuyển đổi type input
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)}
                                    className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 sm:text-sm transition-all pr-10"
                                    placeholder="••••••••"
                                    required 
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-blue-600 transition-colors"
                                >
                                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                </button>
                            </div>
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