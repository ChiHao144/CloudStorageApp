import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/api';
import Swal from 'sweetalert2';
import { FaUser, FaEnvelope, FaLock, FaSave, FaDatabase, FaEyeSlash, FaEye } from 'react-icons/fa';

interface ProfileData {
    display_name?: string;
    email?: string;
    quota?: {
        relative: number;
        used: string;
        total: string;
    };
}

export default function Profile() {
    const { user, isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // State lưu dữ liệu từ API
    const [profile, setProfile] = useState<unknown>(null);

    // State cho form cập nhật
    const [formData, setFormData] = useState({
        displayname: '',
        email: '',
        new_password: ''
    });


    useEffect(() => {
        if (isAuthenticated && user) {
            fetchProfile();
        }
    }, [isAuthenticated, user]);

    const fetchProfile = async () => {
        const password = localStorage.getItem('password');
        if (!user || !password) return;

        const fetchProfile = async () => {
        const password = localStorage.getItem('password');
        if (!user || !password) return;

        try {
            const res = await userApi.getProfile(user, password);
            const data = res.data as ProfileData; // Dùng interface thay cho any
            setProfile(data);
            setFormData({
                displayname: data.display_name || '',
                email: data.email || '',
                new_password: ''
            });
        } catch {
            Swal.fire('Lỗi', 'Không thể tải thông tin cá nhân', 'error');
        } finally {
            setLoading(false);
        }
    };

        const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const password = localStorage.getItem('password');
        if (!user || !password) return;

        setUpdating(true);
        try {
            await userApi.updateProfile(user, password, formData);
            Swal.fire('Thành công', 'Thông tin đã được cập nhật', 'success');
            if (formData.new_password) localStorage.setItem('password', formData.new_password);
            fetchProfile();
        } catch (err: unknown) {
            let errorMessage = 'Cập nhật thất bại';
            // Kiểm tra lỗi mà không dùng any
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response: { data?: { error?: string } } };
                errorMessage = axiosErr.response.data?.error || errorMessage;
            }
            Swal.fire('Lỗi', errorMessage, 'error');
        } finally {
            setUpdating(false);
        }
    };

        if (loading) return <div className="p-10 text-center">Đang tải...</div>;

        const profileData = profile as ProfileData;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Hồ sơ cá nhân</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-4xl mb-4">
                            {user?.charAt(0).toUpperCase()}
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">
                            {profileData?.display_name || user}
                        </h2>
                        <p className="text-gray-500 text-sm">@{user}</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                            <FaDatabase /> Lưu trữ
                        </h3>
                        <div className="space-y-1">
                            <div className="text-2xl font-bold text-blue-600">
                                {Math.round(profileData?.quota?.relative || 0)}%
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${profileData?.quota?.relative || 0}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Dùng {profileData?.quota?.used} trên tổng số {profileData?.quota?.total}</p>
                        </div>
                    </div>
                </div>

                    {/* Cột phải: Form chỉnh sửa */}
                    <div className="md:col-span-2">
                        <form onSubmit={handleUpdate} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên hiển thị</label>
                                    <div className="relative">
                                        <FaUser className="absolute left-3 top-3 text-gray-400" />
                                        <input
                                            type="text"
                                            className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.displayname}
                                            onChange={(e) => setFormData({ ...formData, displayname: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                    <div className="relative">
                                        <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                                        <input
                                            type="email"
                                            className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu mới (Để trống nếu không đổi)</label>
                                    <div className="relative">
                                        <FaLock className="absolute left-3 top-3 text-gray-400" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="w-full pl-10 pr-10 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.new_password}
                                            placeholder="••••••••"
                                            onChange={(e) =>
                                                setFormData({ ...formData, new_password: e.target.value })
                                            }
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
                                disabled={updating}
                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:bg-blue-300"
                            >
                                <FaSave /> {updating ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}