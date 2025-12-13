import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { userApi } from '../services/api';
import { FiUploadCloud } from 'react-icons/fi';

export default function Upload() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    if (!isAuthenticated) {
        if (typeof window !== 'undefined') router.push('/login');
        return null;
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setSelectedFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        if (passwordError && e.target.value) setPasswordError('');
    };

    const handleUpload = async () => {
        if (!password) {
            setPasswordError("Vui lòng nhập mật khẩu để xác thực.");
            return;
        }
        if (!selectedFile || !user) {
            alert("Vui lòng chọn file.");
            return;
        }

        setLoading(true);
        try {
            await userApi.uploadFile(selectedFile, user, password);
            alert(`Tải lên thành công: ${selectedFile.name}!`);
            setSelectedFile(null);
            setPassword('');
        } catch (err: unknown) {
            let errMsg = 'Không thể tải lên file.';

            if (typeof err === 'object' && err !== null && 'response' in err) {
                const response = (err as { response: { data?: { detail?: { msg?: string }[] } } }).response;
                if (response?.data?.detail?.[0]?.msg) {
                    errMsg = response.data.detail[0].msg;
                }
            }
            alert(`Lỗi khi tải lên: ${errMsg}`);
            console.error('Upload Error:', err);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Tải lên tệp tin</h1>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Xác thực mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={handlePasswordChange}
                        className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all ${passwordError ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/50'}`}
                        placeholder="Nhập mật khẩu để tiếp tục"
                        required
                    />
                    {passwordError && <p className="mt-2 text-sm text-red-600">{passwordError}</p>}
                </div>

                <div
                    className={`relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer group ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        id="file-upload"
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleChange}
                    />

                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform text-gray-400 group-hover:text-blue-500 flex justify-center">
                        <FiUploadCloud className="w-16 h-16" />
                    </div>

                    {selectedFile ? (
                        <div className="text-center">
                            <p className="text-lg font-medium text-blue-600 break-all">{selectedFile.name}</p>
                            <p className="text-sm text-gray-500 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            <span className="mt-3 inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">Đã chọn</span>
                        </div>
                    ) : (
                        <div className="text-center space-y-2">
                            <p className="text-lg font-medium text-gray-700">Kéo thả file vào đây</p>
                            <p className="text-sm text-gray-500">hoặc nhấn để chọn file từ máy</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleUpload}
                    disabled={!selectedFile || loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                >
                    {loading ? <div className="loader w-5 h-5 border-2 border-white/30 border-t-white"></div> : 'Tải lên ngay'}
                </button>
            </div>
        </div>
    );
}