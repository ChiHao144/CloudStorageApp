import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

export default function Login() {
    const [username, setUsername] = useState('');
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        await authApi.login(username, 'password'); // Gọi API giả
        login(username); // Chuyển hướng vào dashboard
    };

    return (
        <div style={{maxWidth:'400px', margin:'50px auto', background:'white', padding:'30px', borderRadius:'10px', border:'1px solid #eee'}}>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <div className="input-group">
                    <label>Username</label>
                    <input value={username} onChange={e=>setUsername(e.target.value)} required />
                </div>
                <div className="input-group">
                    <label>Password</label>
                    <input type="password" value="123456" readOnly />
                </div>
                <button className="btn btn-primary" style={{width:'100%'}}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    );
}