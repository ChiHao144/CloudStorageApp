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

            console.log(filesRes);

            // Lấy các thư mục để di chuyển file. Cắt từ danh sách file hiện tại
            const folderList = filesRes.value.data.files.filter(item => item.type === 'directory').map(item => {
                const name = item.name ? decodeURIComponent(item.name) : getFileNameFromPath(item.path);
                return currentPath ? `${currentPath}/${name}` : name;
            });

            console.log('Folders for move:', folderList);
            setFolders(folderList);

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

    const getErrorMessage = (err: unknown): string => {
        if (err && typeof err === 'object' && 'response' in err) {
            const response = (err as { response: { data?: { error?: string } } }).response;
            return response.data?.error || 'Có lỗi xảy ra';
        }
        return err instanceof Error ? err.message : 'Có lỗi xảy ra';
    };

    const handleMoveClick = (e: React.MouseEvent, item: FileItem) => {
        e.stopPropagation();
        setMovingItem(item);
        setMoveTargetPath('');
        setIsMoveModalOpen(true);
    };

    const handleMoveConfirm = async () => {
        if (!movingItem) return;
        const password = localStorage.getItem('password');
        if (!user || !password) return;

        const itemName = movingItem.name ? decodeURIComponent(movingItem.name) : getFileNameFromPath(movingItem.path);
        const sourcePath = currentPath ? `${currentPath}/${itemName}` : itemName;
        const destinationPath = moveTargetPath.endsWith('/') ? `${moveTargetPath}${itemName}` : moveTargetPath;

        try {
            await userApi.moveFileToFolder(user, password, sourcePath, destinationPath);
            Swal.fire('Thành công!', `"${itemName}" đã được di chuyển`, 'success');
            setIsMoveModalOpen(false);
            setMovingItem(null);
            await fetchData();
        } catch (err: unknown) {
            Swal.fire('Lỗi', getErrorMessage(err), 'error');
        }
    };

    /** Share handlers */
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

    const handleShareToUser = async () => {
        if (!targetUser.trim()) {
            Swal.fire('Thông báo', 'Vui lòng nhập tên người dùng cần chia sẻ', 'info');
            return;
        }
        const password = localStorage.getItem('password');
        const item = sharingItem as ExtendedSharingItem;
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

    const handleCreatePublicShare = async () => {
        const password = localStorage.getItem('password');
        const item = sharingItem as ExtendedSharingItem;
        if (!user || !password || !item) return;

        try {
            const res = await userApi.sharePublic(user, password, item.fullPath);
            const data = res.data as { url: string };
            Swal.fire({
                title: 'Thành công!',
                text: `Link chia sẻ: ${data.url}`,
                icon: 'success',
                confirmButtonText: 'Sao chép link'
            }).then((result) => { if (result.isConfirmed) navigator.clipboard.writeText(data.url); });

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
            setCurrentShares(currentShares.filter(s => (s as { id: number }).id !== shareId));
            Swal.fire('Đã xóa', 'Đã hủy quyền chia sẻ thành công.', 'success');
        } catch {
            Swal.fire('Lỗi', 'Không thể xóa chia sẻ.', 'error');
        }
    };

    /** Delete & download handlers */
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
        } catch {
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

    /** Item click for preview or navigate */
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
            setPreviewType('image'); setPreviewContent(userApi.getDownloadUrl(user, password, relativeFilePath)); return;
        }
        if (fileNameLower.match(/\.(mp4|webm|ogg|mov)$/)) {
            setPreviewType('video'); setPreviewContent(userApi.getDownloadUrl(user, password, relativeFilePath)); return;
        }
        if (fileNameLower.match(/\.(pdf)$/)) {
            setPreviewType('pdf'); setPreviewContent(userApi.getDownloadUrl(user, password, relativeFilePath)); return;
        }
        if (fileNameLower.match(/\.(txt|md|json|xml|js|ts|py|html|css|log|java|c|cpp)$/)) {
            setPreviewType('text'); setViewLoading(true);
            try {
                const res = await userApi.viewFileContent(user, password, relativeFilePath);
                setPreviewContent(typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2));
            } catch {
                Swal.fire('Lỗi', 'Không thể đọc nội dung file này.', 'error');
                setPreviewType(null);
            } finally { setViewLoading(false); }
            return;
        }

        window.open(userApi.getDownloadUrl(user, password, relativeFilePath), '_blank');
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
            <div className="pb-12 pt-6">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-800">
                            Xin chào, {user}! <PiHandWavingBold className="text-yellow-400" />
                        </h1>
                        <p className="text-gray-500 mt-1">Quản lý file và dung lượng của bạn</p>
                    </div>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 mb-6 flex items-center gap-2">⚠️ {error}</div>}

                {/* QUOTA CARDS */}
                <h2 className="text-xl font-bold text-gray-800 mb-4">Dung lượng lưu trữ</h2>
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

                {/* FILES LIST */}
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

                {/* PREVIEW, MOVE MODAL, SHARE MODAL */}
                {isMoveModalOpen && movingItem && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[120] p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-800">Di chuyển: {movingItem.name}</h3>
                                <button onClick={() => setIsMoveModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                            </div>
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700">Chọn thư mục đích</label>

                                <select
                                    className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={moveTargetPath}
                                    onChange={(e) => setMoveTargetPath(e.target.value)}
                                >
                                    <option value="">-- Chọn thư mục --</option>
                                    {folders.map((folder, idx) => (
                                        <option key={idx} value={folder}>{folder}</option>
                                    ))}
                                </select>

                                <button
                                    onClick={handleMoveConfirm}
                                    className="w-full bg-green-600 text-white py-2 rounded-xl font-bold hover:bg-green-700 transition-colors"
                                >
                                    Di chuyển
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}