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
            
            setErrorMsg(res.data?.message || 'Đăng nhập thất bại: Cấu trúc phản hồi không hợp lệ.');
            
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
        <div className="login-card">
            <h2 className="login-title">Đăng nhập vào CloudBox</h2>
            
            {errorMsg && (
                <div className="error-message">{errorMsg}</div>
            )}
            
            <form onSubmit={handleLogin}>
                <div className="input-group">
                    <label className="input-label">Username</label>
                    <input 
                        type="text"
                        value={username} 
                        onChange={e=>setUsername(e.target.value)} 
                        placeholder="Nhập tên đăng nhập"
                        required 
                    />
                </div>
                
                <div className="input-group">
                    <label className="input-label">Password</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={e=>setPassword(e.target.value)}
                        placeholder="Nhập mật khẩu"
                        required 
                    />
                </div>
                
                <button className="btn btn-primary login-button" disabled={loading}>
                    {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                </button>
            </form>
            
            <p className="login-footer">
                Chưa có tài khoản? 
                <Link href="/register" className="footer-link">Đăng ký ngay</Link>
            </p>
        </div>
    );
}