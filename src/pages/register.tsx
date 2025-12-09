import { useState } from 'react';
import { authApi } from '../services/api';
import { useRouter } from 'next/router';
import Link from 'next/link';

const validatePassword = (password: string): string | null => {
    if (password.length < 10) {
        return "Mật khẩu phải có ít nhất 10 ký tự.";
    }
    if (!/[A-Z]/.test(password)) {
        return "Mật khẩu phải chứa ít nhất 1 chữ hoa.";
    }
    if (!/[a-z]/.test(password)) {
        return "Mật khẩu phải chứa ít nhất 1 chữ thường.";
    }
    if (!/[^a-zA-Z0-9\s]/.test(password)) {
        return "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt.";
    }
    return null; 
};


export default function Register() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [msg, setMsg] = useState('');
    const [isError, setIsError] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null); 
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg('');
        setPasswordError(null);

        const validationError = validatePassword(password);
        if (validationError) {
            setPasswordError(validationError);
            setIsError(true);
            return;
        }

        try {
            await authApi.register(username, password);
            setMsg('Đăng ký thành công! Đang chuyển hướng...');
            setIsError(false);
            setTimeout(() => router.push('/login'), 2000);
        } catch (err: unknown) { 
            let errorMsg = 'Không thể đăng ký. Vui lòng thử lại.';
            
            if (typeof err === 'object' && err !== null && 'response' in err) {
                const response = (err as { response: { data?: { error?: string, msg?: string }, status?: number } }).response;

                if (response?.status === 400 && response.data?.error) {
                    const errorText = response.data.error.toLowerCase();
                    
                    if (errorText.includes("already exists") || errorText.includes("user already registered")) {
                        errorMsg = 'Lỗi: Tên đăng nhập này đã tồn tại. Vui lòng chọn tên khác.';
                    } else {
                        errorMsg = 'Lỗi: ' + response.data.error; 
                    }
                } else if (response) {
                    errorMsg = `Lỗi ${response.status}: Vui lòng kiểm tra kết nối server.`;
                }
            } else if (err instanceof Error) {
                errorMsg = 'Lỗi: ' + err.message;
            }
            setMsg(errorMsg);
            setIsError(true);
        }
    };

    return (
        <div className="login-card"> 
            <h2 className="login-title">Đăng ký Tài khoản</h2>
            
            {msg && (
                <div className={isError ? "error-message" : "success-message"}>{msg}</div>
            )}
            
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label className="input-label">Username</label>
                    <input 
                        type="text" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        placeholder="Chọn tên đăng nhập"
                        required 
                    />
                </div>
                
                <div className="input-group">
                    <label className="input-label">Password</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        placeholder="Mật khẩu (>= 10 ký tự, có Hoa, thường, đặc biệt)"
                    />
                    {passwordError && (
                        <div className="input-error">{passwordError}</div>
                    )}
                </div>
                
                <button type="submit" className="btn btn-primary login-button">Register</button>
            </form>
            
            <Link href="/login" className="footer-link">Đăng nhập ngay</Link>
        </div>
    );
}