import { useState } from 'react';
import { authApi } from '../services/api';
import { useRouter } from 'next/router';

export default function Register() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [msg, setMsg] = useState('');
    const [isError, setIsError] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await authApi.register(username, password);
            setMsg('Đăng ký thành công! Đang chuyển hướng...');
            setIsError(false);
            setTimeout(() => router.push('/login'), 2000);
        } catch (err: any) {
            setMsg('Lỗi: ' + (err.response?.data?.msg || 'Không thể đăng ký'));
            setIsError(true);
        }
    };

    return (
        <div style={{maxWidth: '400px', margin: '50px auto', background: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'}}>
            <h1 style={{textAlign: 'center'}}>Đăng ký</h1>
            {msg && <div style={{color: isError ? 'red' : 'green', marginBottom: '15px', textAlign: 'center'}}>{msg}</div>}
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label>Username</label>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
                <div className="input-group">
                    <label>Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Register</button>
            </form>
        </div>
    );
}