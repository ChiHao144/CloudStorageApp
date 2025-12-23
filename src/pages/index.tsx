import { useAuth } from '../context/AuthContext';
import FileCard from '../components/FileCard';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { userApi } from '../services/api';
import { PiHandWavingBold } from "react-icons/pi";
import Swal from 'sweetalert2';
import { FaShareAlt } from 'react-icons/fa';

const formatBytes = (bytes: number | string, decimals = 2) => {
    const numBytes = typeof bytes === 'string' ? parseInt(bytes) : bytes;
    if (!numBytes || numBytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(numBytes) / Math.log(k));
    return parseFloat((numBytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const getPlanName = (totalBytes: number) => {
    const GB = 1024 * 1024 * 1024;
    if (totalBytes <= 1 * GB) return { name: 'Gói Free', color: 'bg-gray-100 text-gray-500' };
    if (totalBytes <= 5 * GB) return { name: 'Gói Basic', color: 'bg-blue-100 text-blue-600' };
    if (totalBytes <= 10 * GB) return { name: 'Gói Pro', color: 'bg-indigo-100 text-indigo-600' };
    return { name: 'Gói VIP', color: 'bg-amber-100 text-amber-600' };
};

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

interface ShareItem {
    id: number;
    share_type: number;
    url?: string;
    token?: string;
    share_with_displayname?: string;
    share_with?: string;
}

interface ExtendedSharingItem {
    name?: string;
    path: string;
    displayName: string;
    fullPath: string;
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
    const [previewType, setPreviewType] = useState<'image' | 'video' | 'text' | 'pdf' | null>(null);
    const [viewLoading, setViewLoading] = useState(false);

    const [sharingItem, setSharingItem] = useState<unknown>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [currentShares, setCurrentShares] = useState<unknown[]>([]);

    const [targetUser, setTargetUser] = useState('');
    const [canEditShare, setCanEditShare] = useState(false);

    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [movingItem, setMovingItem] = useState<FileItem | null>(null);
    const [moveTargetPath, setMoveTargetPath] = useState('');
    const [folders, setFolders] = useState<string[]>([]);

    const fetchData = useCallback(async () => {
        if (!user) return;
        const password = localStorage.getItem('password');
        if (!password) {
            Swal.fire('Lỗi', 'Vui lòng đăng xuất và đăng nhập lại.', 'error');
            setLoading(false);
            return;
        }

        try {
            let filesApiCall;
            if (currentPath) filesApiCall = userApi.getFilesFolder(user, password, currentPath);
            else filesApiCall = userApi.getFiles(user, password);

            const [quotaRes, filesRes] = await Promise.allSettled([
                userApi.getQuota(user, password),
                filesApiCall
            ]);

            const isQuotaResponseValid = (data: unknown): data is { quota: QuotaData } => {
                if (typeof data !== 'object' || data === null) return false;
                const d = data as { quota?: unknown };
                return typeof d.quota === 'object' && d.quota !== null && 'used' in (d.quota as object);
            };

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
                    setFiles(meaningfulItems);
                } else setFiles([]);

                const meaningfulItems = rawList.filter(f => {
                    const name = f.name
                        ? decodeURIComponent(f.name)
                        : getFileNameFromPath(f.path);
                    if (!name || name === user) return false;
                    return true;
                });

                const folderList = meaningfulItems
                    .filter(item => item.type === 'directory')
                    .map(item => {
                        const name = item.name
                            ? decodeURIComponent(item.name)
                            : getFileNameFromPath(item.path);

                        const path = currentPath
                            ? `${currentPath}/${name}`
                            : name;

                        return path;
                    });

                setFolders(folderList);
            }
        } catch (err) {
            console.error(err);
            setError("Có lỗi xảy ra khi tải dữ liệu.");
        } finally { setLoading(false); }
    }, [user, currentPath]);

    useEffect(() => {
        if (!isAuthenticated) { router.push('/login'); return; }
        fetchData();
    }, [isAuthenticated, user, router, currentPath, fetchData]);

    const handleMoveClick = (e: React.MouseEvent, item: FileItem) => {
        e.stopPropagation();
        setMovingItem(item);
        setMoveTargetPath('');
        setIsMoveModalOpen(true);
    };


    const handleMoveConfirm = async () => {
        if (!movingItem || !user) return;
        const password = localStorage.getItem('password');
        if (!password) return;

        const itemName = movingItem.name ? decodeURIComponent(movingItem.name) : getFileNameFromPath(movingItem.path);
        const sourcePath = currentPath ? `${currentPath}/${itemName}` : itemName;
        // Đảm bảo destinationPath có tên file ở cuối
        const destinationPath = moveTargetPath
            ? (moveTargetPath.endsWith('/') ? `${moveTargetPath}${itemName}` : `${moveTargetPath}/${itemName}`)
            : itemName;

        try {
            await userApi.moveFileToFolder(user, password, sourcePath, destinationPath);
            Swal.fire('Thành công!', `Đã chuyển "${itemName}" tới "${moveTargetPath || 'Root'}"`, 'success');
            setIsMoveModalOpen(false);
            await fetchData(); // Load lại danh sách file
        } catch {
            Swal.fire('Lỗi', 'Không thể di chuyển tập tin', 'error');
        }
    };

    const getErrorMessage = (err: unknown): string => {
        if (err && typeof err === 'object' && 'response' in err) {
            const response = (err as { response: { data?: { error?: string } } }).response;
            return response.data?.error || 'Có lỗi xảy ra';
        }
        return err instanceof Error ? err.message : 'Có lỗi xảy ra';
    };

    const handleShareToUser = async () => {
        if (!targetUser.trim()) {
            Swal.fire('Thông báo', 'Vui lòng nhập tên người dùng cần chia sẻ', 'info');
            return;
        }

        const password = localStorage.getItem('password');
        const item = sharingItem as ExtendedSharingItem; // Ép kiểu từ unknown
        if (!user || !password || !item) return;

        try {
            await userApi.shareToUser(user, password, item.fullPath, targetUser, canEditShare);
            Swal.fire('Thành công!', `Đã chia sẻ với người dùng ${targetUser}`, 'success');
            setTargetUser('');
            const updated = await userApi.listShares(user, password, item.fullPath);
            setCurrentShares(Array.isArray(updated.data) ? updated.data : []);
        } catch (err: unknown) {
            Swal.fire('Lỗi', getErrorMessage(err), 'error');
        }
    };

    const handleShareClick = async (e: React.MouseEvent, item: unknown) => {
        e.stopPropagation();
        const password = localStorage.getItem('password');
        if (!user || !password) return;

        const fileItem = item as { name?: string; path: string };
        const itemName = fileItem.name ? decodeURIComponent(fileItem.name) : getFileNameFromPath(fileItem.path);
        const fullPath = currentPath ? `${currentPath}/${itemName}` : itemName;

        setSharingItem({ ...fileItem, displayName: itemName, fullPath } as unknown);
        setIsShareModalOpen(true);

        try {
            const res = await userApi.listShares(user, password, fullPath);
            setCurrentShares(Array.isArray(res.data) ? res.data : []);
        } catch {
            setCurrentShares([]);
        }
    };

    const handleCreatePublicShare = async () => {
        const password = localStorage.getItem('password');
        const item = sharingItem as ExtendedSharingItem; // Ép kiểu từ unknown
        if (!user || !password || !item) return;

        try {
            const res = await userApi.sharePublic(user, password, item.fullPath);
            const data = res.data as { url: string };
            Swal.fire({
                title: 'Thành công!',
                text: `Link chia sẻ: ${data.url}`,
                icon: 'success',
                confirmButtonText: 'Sao chép link'
            }).then((result) => {
                if (result.isConfirmed) navigator.clipboard.writeText(data.url);
            });

            const updated = await userApi.listShares(user, password, item.fullPath);
            setCurrentShares(Array.isArray(updated.data) ? updated.data : []);
        } catch (err: unknown) {
            Swal.fire('Lỗi', getErrorMessage(err), 'error');
        }
    };

    const handleDeleteShare = async (shareId: number) => {
        const password = localStorage.getItem('password');
        if (!user || !password) return;

        try {
            await userApi.deleteShare(user, password, shareId);

            // Ép kiểu 's' thành bất kỳ đối tượng nào có thuộc tính id: number
            setCurrentShares(currentShares.filter(s => (s as { id: number }).id !== shareId));

            Swal.fire('Đã xóa', 'Đã hủy quyền chia sẻ thành công.', 'success');
        } catch {
            Swal.fire('Lỗi', 'Không thể xóa chia sẻ.', 'error');
        }
    };

    const handleDelete = async (e: React.MouseEvent, item: FileItem) => {
        e.stopPropagation();

        const itemName = item.name ? decodeURIComponent(item.name) : getFileNameFromPath(item.path);
        const typeText = item.type === 'directory' ? 'thư mục' : 'file';

        const result = await Swal.fire({
            title: `Xóa ${typeText}?`,
            text: `Bạn có chắc chắn muốn xóa "${itemName}" không? Hành động này không thể hoàn tác.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Xóa ngay',
            cancelButtonText: 'Hủy bỏ'
        });

        if (!result.isConfirmed) return;

        const password = localStorage.getItem('password');
        if (!user || !password) return;

        const relativeFilePath = currentPath ? `${currentPath}/${itemName}` : itemName;

        try {
            await userApi.deleteFile(user, password, relativeFilePath);
            await fetchData();
            Swal.fire('Đã xóa!', `${typeText} đã được xóa thành công.`, 'success');
        } catch (err) {
            console.error(err);
            Swal.fire('Lỗi!', 'Không thể xóa file. Vui lòng thử lại.', 'error');
        }
    };

    const handleDownload = (e: React.MouseEvent, item: FileItem) => {
        e.stopPropagation();

        const password = localStorage.getItem('password');
        if (!user || !password) return;

        const itemName = item.name ? decodeURIComponent(item.name) : getFileNameFromPath(item.path);
        const relativeFilePath = currentPath ? `${currentPath}/${itemName}` : itemName;
        const downloadUrl = userApi.getDownloadLink(user, password, relativeFilePath);

        window.open(downloadUrl, '_blank');
    };

    const handleItemClick = async (item: FileItem) => {
        const itemName = item.name ? decodeURIComponent(item.name) : getFileNameFromPath(item.path);
        if (item.type === 'directory') {
            const newPath = currentPath ? `${currentPath}/${itemName}` : itemName;
            const currentFolder = currentPath.split('/').pop();
            if (itemName === currentFolder) return;
            setCurrentPath(newPath);
            setLoading(true);
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


        if (fileNameLower.match(/\.(pdf)$/)) {
            const pdfUrl = userApi.getDownloadUrl(user, password, relativeFilePath);
            setPreviewType('pdf');
            setPreviewContent(pdfUrl);
            return;
        }

        if (fileNameLower.match(/\.(txt|md|json|xml|js|ts|py|html|css|log|java|c|cpp)$/)) {
            setPreviewType('text'); setViewLoading(true);
            try {
                const res = await userApi.viewFileContent(user, password, relativeFilePath);
                const content = typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2);
                setPreviewContent(content);
            } catch {
                Swal.fire('Lỗi', 'Không thể đọc nội dung file này.', 'error');
                setPreviewType(null);
            } finally { setViewLoading(false); }
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
    const planInfo = getPlanName(totalSpace);

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
                            <div className={`mt-4 text-xs inline-block px-2 py-1 rounded ${planInfo.color}`}>
                                {planInfo.name}
                            </div>
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
                                        onDelete={(e) => handleDelete(e, f)}
                                        onDownload={(e) => handleDownload(e, f)}
                                        onShare={(e) => handleShareClick(e, f)}
                                        onMove={(e) => handleMoveClick(e, f)}
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
                                        {previewType === 'pdf'}
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
                                    ) : previewType === 'pdf' ? (
                                        <iframe src={previewContent as string} className="w-full h-full min-h-[80vh]" title="PDF Preview"></iframe>
                                    ) : (
                                        <div className="w-full h-full p-6 bg-white overflow-auto">
                                            <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap leading-relaxed">{previewContent}</pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {/* MODAL SHARING */}
                    {isShareModalOpen && (

                        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4">
                            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-gray-800 truncate pr-4">
                                        Chia sẻ: {(sharingItem as { displayName: string })?.displayName}
                                    </h3>
                                    <button onClick={() => setIsShareModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                                </div>
                                <div className="mb-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Chia sẻ với người dùng</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Nhập username..."
                                                className="flex-1 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={targetUser}
                                                onChange={(e) => setTargetUser(e.target.value)}
                                            />
                                            <button
                                                onClick={handleShareToUser}
                                                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
                                            >
                                                Chia sẻ
                                            </button>
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="canEdit"
                                                checked={canEditShare}
                                                onChange={(e) => setCanEditShare(e.target.checked)}
                                            />
                                            <label htmlFor="canEdit" className="text-xs text-gray-600">Cho phép chỉnh sửa</label>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t"></span></div>
                                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400">Hoặc</span></div>
                                    </div>

                                    <button
                                        onClick={handleCreatePublicShare}
                                        className="w-full border-2 border-blue-600 text-blue-600 py-2.5 rounded-xl font-bold hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <FaShareAlt /> Tạo Link Công Khai
                                    </button>
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Lượt chia sẻ hiện tại</h4>
                                    {currentShares.length === 0 ? (
                                        <p className="text-gray-400 text-sm italic">Chưa có chia sẻ nào cho tệp này.</p>
                                    ) : (
                                        <div className="space-y-3 max-h-60 overflow-auto pr-2">
                                            {currentShares.map((s: unknown) => {
                                                const share = s as ShareItem; // Ép kiểu để dùng thuộc tính
                                                return (
                                                    <div key={share.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                        <div className="truncate flex-1 mr-3">
                                                            <div className="text-sm font-semibold text-gray-700 truncate">
                                                                {share.share_type === 3 ? (
                                                                    <a href={share.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                                                        Link công khai: {share.token}
                                                                    </a>
                                                                ) : (
                                                                    <span className="flex items-center gap-2">
                                                                        {share.share_with_displayname || share.share_with}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button onClick={() => handleDeleteShare(share.id)} className="text-red-500 p-2">✕</button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {isMoveModalOpen && (
                        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[120]">
                            <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
                                <h3 className="text-xl font-bold mb-4">Di chuyển tập tin</h3>
                                <p className="text-sm text-gray-500 mb-4">Chọn thư mục đích cho: <b>{movingItem?.name}</b></p>

                                <select
                                    className="w-full border p-2 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={moveTargetPath}
                                    onChange={(e) => setMoveTargetPath(e.target.value)}
                                >
                                    <option value="">Thư mục gốc (Root)</option>
                                    {folders.map((f, i) => (
                                        <option key={i} value={f}>{f}</option>
                                    ))}
                                </select>

                                <div className="flex gap-2">
                                    <button onClick={() => setIsMoveModalOpen(false)} className="flex-1 py-2 bg-gray-100 rounded-lg font-bold">Hủy</button>
                                    <button onClick={handleMoveConfirm} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">Di chuyển</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}