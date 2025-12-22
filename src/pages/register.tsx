import { useState } from 'react';
import { authApi } from '../services/api';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const validatePassword = (password: string): string | null => {
    if (password.length < 10) return "Mật khẩu phải có ít nhất 10 ký tự.";
    if (!/[A-Z]/.test(password)) return "Mật khẩu phải chứa ít nhất 1 chữ hoa.";
    if (!/[a-z]/.test(password)) return "Mật khẩu phải chứa ít nhất 1 chữ thường.";
    return null; 
};

export default function Register() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null); 
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);

        const validationError = validatePassword(password);
        if (validationError) {
            setPasswordError(validationError);
            Swal.fire({
                icon: 'warning',
                title: 'Mật khẩu chưa đủ mạnh',
                text: validationError,
            });
            return;
        }

        try {
            await authApi.register(username, password);
            
            await Swal.fire({
                icon: 'success',
                title: 'Đăng ký thành công!',
                text: 'Đang chuyển hướng đến trang đăng nhập...',
                timer: 2000,
                showConfirmButton: false
            });
            
            router.push('/login');
        } catch (err: unknown) { 
            let errorMsg = 'Không thể đăng ký. Vui lòng thử lại.';
            
            if (typeof err === 'object' && err !== null && 'response' in err) {
                const response = (err as { response: { data?: { error?: string, msg?: string }, status?: number } }).response;
                if (response?.status === 400 && response.data?.error) {
                    const errorText = String(response.data.error).toLowerCase();
                    if (errorText.includes("already exists") || errorText.includes("user already registered")) {
                        errorMsg = 'Tên đăng nhập này đã tồn tại.';
                    } else {
                        errorMsg = 'Lỗi: ' + response.data.error; 
                    }
                } else if (response) {
                    errorMsg = `Lỗi ${response.status}: Vui lòng kiểm tra kết nối server.`;
                }
            }
            
            Swal.fire({
                icon: 'error',
                title: 'Đăng ký thất bại',
                text: errorMsg
            });
        }
    };

    return (
        <div className="flex min-h-[80vh] items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
                <div className="text-center">
                    <h2 className="mt-2 text-3xl font-extrabold text-gray-900">Tạo tài khoản</h2>
                    <p className="mt-2 text-sm text-gray-600">Tham gia CloudBox ngay hôm nay</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Tên đăng nhập</label>
                            <input 
                                type="text" 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)} 
                                className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 sm:text-sm transition-all"
                                placeholder="Chọn tên đăng nhập"
                                required 
                            />
                        </div>
                        
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu</label>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"} // Chuyển đổi type input
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    className={`block w-full rounded-lg border px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 sm:text-sm transition-all pr-10 ${passwordError ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/50'}`}
                                    placeholder="••••••••"
                                    required 
                                />
                                {/* Nút bật/tắt hiển thị mật khẩu */}
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-blue-600 transition-colors"
                                >
                                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                </button>
                            </div>
                            {passwordError && (
                                <p className="mt-1 text-xs text-red-600">{passwordError}</p>
                            )}
                            <p className="mt-2 text-xs text-gray-500">Mật khẩu cần ít nhất 10 ký tự, bao gồm chữ hoa và chữ thường.</p>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="group relative flex w-full justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg"
                    >
                        Đăng ký
                    </button>
                </form>
                
                <p className="text-center text-sm text-gray-600">
                    Đã có tài khoản?{' '}
                    <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
                        Đăng nhập ngay
                    </Link>
                </p>
            </div>
        </div>
    );
}