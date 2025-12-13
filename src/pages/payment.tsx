import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/api'; 
import { useRouter } from 'next/router';

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
        <div className="flex min-h-[80vh] items-center justify-center px-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                <div className="text-center mb-8">
                    <div className="inline-block p-3 rounded-full bg-blue-50 text-blue-600 mb-4 text-4xl">💳</div>
                    <h1 className="text-2xl font-bold text-gray-800">Nâng cấp gói cước</h1>
                    <p className="text-gray-500 mt-2 text-sm">Xin chào <b>{user}</b>, hãy chọn gói phù hợp</p>
                </div>
                
                {msg && (
                    <div className={`mb-6 p-4 rounded-lg text-sm flex items-center gap-2 ${isError ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                        {msg}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Số tiền (USD)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input 
                                type="number" 
                                step="0.01" 
                                value={amount} 
                                onChange={(e) => setAmount(parseFloat(e.target.value))} 
                                className="block w-full pl-7 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all outline-none"
                                required 
                                min="1"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">USD</span>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex justify-center items-center"
                    >
                        {loading ? <div className="loader w-5 h-5 border-2 border-white/30 border-t-white"></div> : `Thanh toán $${amount}`}
                    </button>
                </form>
            </div>
        </div>
    );
}