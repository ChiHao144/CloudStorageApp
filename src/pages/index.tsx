import { useAuth } from '../context/AuthContext';
import FileCard from '../components/FileCard';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { userApi } from '../services/api';
import { PiHandWavingBold } from "react-icons/pi";


const formatBytes = (bytes: number | string, decimals = 2) => {
    const numBytes = typeof bytes === 'string' ? parseInt(bytes) : bytes;
    if (!numBytes || numBytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(numBytes) / Math.log(k));
    return parseFloat((numBytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const getFileNameFromPath = (path: string): string => {
    try {
        let cleanPath = path;
        if (cleanPath.endsWith('/')) cleanPath = cleanPath.slice(0, -1);
        const segments = cleanPath.split('/');
        return decodeURIComponent(segments[segments.length - 1]);
    } catch { return path; }
}

interface QuotaData {
    used: string; free: string; total: string; relative: string;
}
interface FileItem {
    name?: string; size: number | string; path: string; type: string; modified: string;
}

export default function Dashboard() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [quota, setQuota] = useState<QuotaData | null>(null);
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPath, setCurrentPath] = useState('');
    const [previewContent, setPreviewContent] = useState<string | null>(null);
    const [previewType, setPreviewType] = useState<'image' | 'video' | 'text' | null>(null);
    const [viewLoading, setViewLoading] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) { router.push('/login'); return; }
        const isQuotaResponseValid = (data: unknown): data is { quota: QuotaData } => {
            if (typeof data !== 'object' || data === null) return false;
            const d = data as { quota?: unknown };
            return typeof d.quota === 'object' && d.quota !== null && 'used' in (d.quota as object);
        };
        const fetchData = async () => {
            if (!user) return;
            const password = localStorage.getItem('password');
            if (!password) { setError("Vui lòng đăng xuất và đăng nhập lại."); setLoading(false); return; }
            setLoading(true);
            try {
                let filesApiCall;
                if (currentPath) filesApiCall = userApi.getFilesFolder(user, password, currentPath);
                else filesApiCall = userApi.getFiles(user, password);

                const [quotaRes, filesRes] = await Promise.allSettled([
                    userApi.getQuota(user, password),
                    filesApiCall
                ]);

                if (quotaRes.status === 'fulfilled' && isQuotaResponseValid(quotaRes.value.data)) {
                    setQuota(quotaRes.value.data.quota);
                }
                if (filesRes.status === 'fulfilled') {
                    const data = filesRes.value.data as { files?: unknown; items?: unknown };
                    const rawList = (Array.isArray(data.items) ? data.items : (Array.isArray(data.files) ? data.files : [])) as FileItem[];
                    if (rawList.length > 0) {
                        const meaningfulItems = rawList.filter(f => {
                            const name = f.name ? decodeURIComponent(f.name) : getFileNameFromPath(f.path);
                            if (!name || name === user) return false;
                            if (currentPath) {
                                let p = decodeURIComponent(f.path);
                                if (p.endsWith('/')) p = p.slice(0, -1);
                                if (p === currentPath || p.endsWith(`/${currentPath}`)) return false;
                            }
                            return true;
                        });
                        meaningfulItems.sort((a, b) => {
                            const dateA = new Date(a.modified).getTime();
                            const dateB = new Date(b.modified).getTime();
                            return dateB - dateA;
                        });
                        setFiles(meaningfulItems);
                    } else setFiles([]);
                }
            } catch (err) { console.error(err); setError("Có lỗi xảy ra khi tải dữ liệu."); } finally { setLoading(false); }
        };
        fetchData();
    }, [isAuthenticated, user, router, currentPath]);

    const handleItemClick = async (item: FileItem) => {
        const itemName = item.name ? decodeURIComponent(item.name) : getFileNameFromPath(item.path);
        if (item.type === 'directory') {
            const newPath = currentPath ? `${currentPath}/${itemName}` : itemName;
            const currentFolder = currentPath.split('/').pop();
            if (itemName === currentFolder) return;
            setCurrentPath(newPath);
            return;
        }
        const password = localStorage.getItem('password');
        if (!user || !password) return;
        const relativeFilePath = currentPath ? `${currentPath}/${itemName}` : itemName;
        const fileNameLower = itemName.toLowerCase();

        if (fileNameLower.match(/\.(jpeg|jpg|png|gif|webp)$/)) {
            const imgUrl = userApi.getDownloadUrl(user, password, relativeFilePath);
            setPreviewType('image'); setPreviewContent(imgUrl); return;
        }
        if (fileNameLower.match(/\.(mp4|webm|ogg|mov)$/)) {
            const videoUrl = userApi.getDownloadUrl(user, password, relativeFilePath);
            setPreviewType('video'); setPreviewContent(videoUrl); return;
        }
        if (fileNameLower.match(/\.(txt|md|json|xml|js|ts|py|html|css|log|java|c|cpp|docx|pdf)$/)) {
            if (fileNameLower.match(/\.(doc)$/)) {
                const downloadUrl = userApi.getDownloadUrl(user, password, relativeFilePath);
                window.open(downloadUrl, '_blank'); return;
            }
            setPreviewType('text'); setViewLoading(true);
            try {
                const res = await userApi.viewFileContent(user, password, relativeFilePath);
                const content = typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2);
                setPreviewContent(content);
            } catch { alert("Không thể đọc nội dung file này."); setPreviewType(null); } finally { setViewLoading(false); }
            return;
        }
        const downloadUrl = userApi.getDownloadUrl(user, password, relativeFilePath);
        window.open(downloadUrl, '_blank');
    };

    const handleGoBack = () => {
        if (!currentPath) return;
        const parts = currentPath.split('/'); parts.pop(); setCurrentPath(parts.join('/'));
    };
    const closePreview = () => { setPreviewContent(null); setPreviewType(null); };

    if (!user) return null;
    const usedSpace = quota?.used ? parseInt(quota.used) : 0;
    const totalSpace = quota?.total ? parseInt(quota.total) : 0;
    const freeSpace = quota?.free ? parseInt(quota.free) : 0;

    return (
        <main className="flex-1 w-full bg-gray-50 min-h-[calc(100vh-64px)]">
            <div >
                <div className="pb-12 pt-6">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
                        <div>
                            <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-800">
                                Xin chào, {user}!
                                <PiHandWavingBold className="text-yellow-400" />
                            </h1>
                            <p className="text-gray-500 mt-1">Quản lý file và dung lượng của bạn</p>
                        </div>
                    </div>

                    {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 mb-6 flex items-center gap-2">⚠️ {error}</div>}

                    {/* QUOTA CARDS */}
                    <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        {/* <span className="text-blue-500">📊Dung lượng lưu trữ</span> */}
                        <h2 className="text-xl font-bold text-gray-800">Dung lượng lưu trữ</h2>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="text-gray-500 text-sm font-medium mb-1">Đã sử dụng</div>
                            <div className="text-3xl font-bold text-blue-600">{formatBytes(usedSpace)}</div>
                            <div className="w-full bg-gray-100 rounded-full h-2 mt-4 overflow-hidden">
                                <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${(usedSpace / totalSpace) * 100}%` }}></div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="text-gray-500 text-sm font-medium mb-1">Tổng dung lượng</div>
                            <div className="text-3xl font-bold text-gray-800">{formatBytes(totalSpace)}</div>
                            <div className="mt-4 text-xs text-gray-400">Gói Free</div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="text-gray-500 text-sm font-medium mb-1">Còn trống</div>
                            <div className="text-3xl font-bold text-green-500">{formatBytes(freeSpace)}</div>
                            <div className="mt-4 text-xs text-green-600 bg-green-50 inline-block px-2 py-1 rounded">Sẵn sàng upload</div>
                        </div>
                    </div>

                    {/* FILES LIST HEADER */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-gray-800">Tệp tin của bạn</h2>
                            <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-bold border border-gray-200">{files.length}</span>
                        </div>
                        {currentPath && (
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 transition-colors cursor-pointer group" onClick={handleGoBack}>
                                <button className="text-gray-500 group-hover:text-blue-600 font-medium text-sm flex items-center gap-1 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Quay lại
                                </button>
                                <span className="text-gray-300 mx-1">|</span>
                                <span className="text-gray-600 text-sm font-medium truncate max-w-[200px] flex items-center gap-1">
                                    📁 {currentPath}
                                </span>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="loader w-10 h-10 border-4 mb-4"></div>
                            <p className="text-gray-500 text-sm animate-pulse">Đang tải dữ liệu...</p>
                        </div>
                    ) : files.length === 0 ? (
                        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center hover:border-gray-300 transition-colors">
                            <div className="text-5xl mb-4 opacity-50">📂</div>
                            <p className="text-gray-800 font-medium text-lg">Thư mục này đang trống</p>
                            <p className="text-gray-500 text-sm mt-1">Hãy thử upload file mới</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {files.map((f, i) => (
                                <div key={i} onClick={() => handleItemClick(f)} className="h-full">
                                    <FileCard
                                        name={f.name ? decodeURIComponent(f.name) : getFileNameFromPath(f.path)}
                                        size={formatBytes(f.size || 0)}
                                        type={f.type === 'directory' ? 'directory' : 'file'}
                                        modified={f.modified}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {(previewContent || viewLoading) && (
                        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[100] p-4 animate-in fade-in duration-200" onClick={closePreview}>
                            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-5xl max-h-[90vh] flex flex-col relative" onClick={e => e.stopPropagation()}>
                                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                                    <span className="font-semibold text-gray-800 flex items-center gap-2">
                                        {previewType === 'image'}
                                        {previewType === 'video'}
                                        {previewType === 'text'}
                                        Xem trước
                                    </span>
                                    <button onClick={closePreview} className="text-gray-400 hover:text-gray-700 hover:bg-gray-200 p-2 rounded-full transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="overflow-auto flex-1 bg-gray-100 flex items-center justify-center min-h-[400px]">
                                    {viewLoading ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="loader w-10 h-10 border-4 border-gray-200 border-t-blue-600"></div>
                                            <p className="text-sm text-gray-500">Đang tải nội dung...</p>
                                        </div>
                                    ) : previewType === 'image' ? (
                                        <img src={previewContent as string} alt="Preview" className="max-w-full max-h-[80vh] object-contain shadow-lg" />
                                    ) : previewType === 'video' ? (
                                        <video src={previewContent as string} controls autoPlay className="max-w-full max-h-[80vh] shadow-lg rounded-lg bg-black" />
                                    ) : (
                                        <div className="w-full h-full p-6 bg-white overflow-auto">
                                            <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap leading-relaxed">{previewContent}</pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}