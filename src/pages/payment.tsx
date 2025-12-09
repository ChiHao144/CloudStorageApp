import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/api'; 
import { useRouter } from 'next/router';
import Loader from '../components/Loader'; 

export default function Payment() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [amount, setAmount] = useState(10.00); 
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [isError, setIsError] = useState(false);

    if (!isAuthenticated) {
        if (typeof window !== 'undefined') router.push('/login');
        return null;
    }
    
    if (!user) return null;


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMsg('');
        
        try {
            const res = await userApi.makePayment(user, amount);
            
            setMsg(res.data.message);
            setIsError(false);
            
        } catch (err: unknown) {
            let errorMsg = 'Thanh toán thất bại: Lỗi kết nối API.';
            
            if (typeof err === 'object' && err !== null && 'response' in err) {
                const response = (err as { response: { data?: { message?: string }, status?: number } }).response;
                if (response?.data?.message) {
                     errorMsg = `Lỗi: ${response.data.message}`;
                } else if (response?.status) {
                     errorMsg = `Lỗi HTTP ${response.status}. Vui lòng thử lại.`;
                }
            }
            setMsg(errorMsg);
            setIsError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-card">
            <h1 className="login-title">Nâng cấp Tài khoản (Giả lập)</h1>
            <p className="payment-user-info">Xin chào, **{user}**! Vui lòng chọn số tiền bạn muốn nạp để nâng cấp quota.</p>
            
            {msg && (
                <div className={isError ? "error-message" : "success-message"}>{msg}</div>
            )}
            
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label className="input-label">Số tiền (USD)</label>
                    <input 
                        type="number" 
                        step="0.01" 
                        value={amount} 
                        onChange={(e) => setAmount(parseFloat(e.target.value))} 
                        required 
                        min="1"
                    />
                </div>
                
                <button type="submit" className="btn btn-primary login-button" disabled={loading}>
                    {loading ? <Loader /> : `Thanh toán ${amount}$`}
                </button>
            </form>
        </div>
    );
}