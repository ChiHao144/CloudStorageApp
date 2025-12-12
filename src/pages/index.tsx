import { useAuth } from '../context/AuthContext';
import FileCard from '../components/FileCard';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { userApi } from '../services/api';
import Loader from '../components/Loader';

// Hàm format bytes
const formatBytes = (bytes: number | string, decimals = 2) => {
    const numBytes = typeof bytes === 'string' ? parseInt(bytes) : bytes;
    if (!numBytes || numBytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(numBytes) / Math.log(k));
    return parseFloat((numBytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Hàm lấy tên file từ path (Fallback nếu API không trả về name)
const getFileNameFromPath = (path: string): string => {
    try {
        let cleanPath = path;
        if (cleanPath.endsWith('/')) {
            cleanPath = cleanPath.slice(0, -1);
        }
        const segments = cleanPath.split('/');
        const filename = segments[segments.length - 1];
        return decodeURIComponent(filename);
    } catch {
        return path; 
    }
}

interface QuotaData {
    used: string;
    free: string;
    total: string;
    relative: string;
}

interface FileItem {
    name?: string; // API mới có trả về name
    size: number | string;
    path: string;
    type: string; 
    modified: string; 
}

export default function Dashboard() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    
    const [quota, setQuota] = useState<QuotaData | null>(null);
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // State đường dẫn hiện tại (Lưu trữ dạng Clean/Decoded: "Documents/Tài liệu")
    const [currentPath, setCurrentPath] = useState('');

    // State cho Modal Xem File
    const [previewContent, setPreviewContent] = useState<string | null>(null);
    const [previewType, setPreviewType] = useState<'image' | 'video' | 'text' | null>(null);
    const [viewLoading, setViewLoading] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        const isQuotaResponseValid = (data: unknown): data is { quota: QuotaData } => {
            if (typeof data !== 'object' || data === null) return false;
            const d = data as { quota?: unknown };
            return typeof d.quota === 'object' && d.quota !== null && 'used' in (d.quota as object);
        };

        const fetchData = async () => {
            if (!user) return;
            
            const password = localStorage.getItem('password'); 
            if (!password) {
                setError("Vui lòng đăng xuất và đăng nhập lại.");
                setLoading(false);
                return;
            }
            setLoading(true);

            try {
                let filesApiCall;

                // Gọi API: userApi đã xử lý params, ta chỉ cần truyền path sạch
                if (currentPath) {
                    filesApiCall = userApi.getFilesFolder(user, password, currentPath);
                } else {
                    filesApiCall = userApi.getFiles(user, password);
                }

                const [quotaRes, filesRes] = await Promise.allSettled([
                    userApi.getQuota(user, password),
                    filesApiCall
                ]);

                if (quotaRes.status === 'fulfilled' && isQuotaResponseValid(quotaRes.value.data)) {
                    setQuota(quotaRes.value.data.quota);
                }

                if (filesRes.status === 'fulfilled') {
                    const data = filesRes.value.data as { files?: unknown; items?: unknown };
                    // Hỗ trợ cả 2 định dạng 'items' (mới) và 'files' (cũ)
                    const rawList = (Array.isArray(data.items) ? data.items : (Array.isArray(data.files) ? data.files : [])) as FileItem[];

                    if (rawList.length > 0) {
                        const meaningfulItems = rawList.filter(f => {
                            // 1. Lấy tên hiển thị
                            const displayName = f.name ? decodeURIComponent(f.name) : getFileNameFromPath(f.path);
                            
                            // Lọc bỏ root/user home
                            if (!displayName || displayName === user) return false;

                            // 2. Lọc bỏ chính folder hiện tại (Fix lỗi đè folder)
                            if (currentPath) {
                                // QUAN TRỌNG: Phải decode path từ API trước khi so sánh với currentPath
                                let p = decodeURIComponent(f.path);
                                if (p.endsWith('/')) p = p.slice(0, -1);
                                
                                // So sánh chính xác đường dẫn
                                if (p === currentPath || p.endsWith(`/${currentPath}`)) return false;
                            }
                            return true; 
                        });
                        setFiles(meaningfulItems);
                    } else {
                        setFiles([]); 
                    }
                }
            } catch (err) {
                console.error(err);
                setError("Có lỗi xảy ra khi tải dữ liệu.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isAuthenticated, user, router, currentPath]);

    // Xử lý Click vào File/Folder
    const handleItemClick = async (item: FileItem) => {
        // Lấy tên hiển thị sạch sẽ (decode nếu cần)
        const rawName = item.name ? item.name : getFileNameFromPath(item.path);
        const itemName = decodeURIComponent(rawName);

        // 1. Xử lý Folder
        if (item.type === 'directory') {
            // Logic nối đường dẫn an toàn
            const newPath = currentPath ? `${currentPath}/${itemName}` : itemName;
            
            // Chặn click vào chính folder đang mở (phòng hờ)
            const currentFolder = currentPath.split('/').pop();
            if (itemName === currentFolder) return; 

            setCurrentPath(newPath);
            return;
        } 
        
        // 2. Xử lý File
        const password = localStorage.getItem('password');
        if (!user || !password) return;

        // --- CẬP NHẬT QUAN TRỌNG: Tự tạo đường dẫn File ---
        // Thay vì dùng item.path (có thể chứa /remote.php/...), ta tự ghép currentPath + itemName
        // Kết quả sẽ là đường dẫn tương đối chuẩn: "Documents/file.txt" hoặc "file.txt"
        const relativeFilePath = currentPath ? `${currentPath}/${itemName}` : itemName;

        // Lấy đuôi file để check loại
        const fileNameLower = itemName.toLowerCase();
        
        // A. Ảnh
        if (fileNameLower.match(/\.(jpeg|jpg|png|gif|webp)$/)) {
            // Truyền đường dẫn sạch (relativeFilePath) vào API
            const imgUrl = userApi.getDownloadUrl(user, password, relativeFilePath);
            setPreviewType('image');
            setPreviewContent(imgUrl);
            return;
        }

        // B. Video
        if (fileNameLower.match(/\.(mp4|webm|ogg|mov)$/)) {
            const videoUrl = userApi.getDownloadUrl(user, password, relativeFilePath);
            setPreviewType('video');
            setPreviewContent(videoUrl);
            return;
        }

        // C. Text/Code
        if (fileNameLower.match(/\.(txt|md|json|xml|js|ts|py|html|css|log|java|c|cpp|docx)$/)) {
            // Với docx/pdf nên mở tab mới vì API viewFileContent chỉ trả text
            if (fileNameLower.match(/\.(docx|doc|pdf)$/)) {
                 const downloadUrl = userApi.getDownloadUrl(user, password, relativeFilePath);
                 window.open(downloadUrl, '_blank');
                 return;
            }

            setPreviewType('text');
            setViewLoading(true);
            try {
                const res = await userApi.viewFileContent(user, password, relativeFilePath);
                const content = typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2);
                setPreviewContent(content);
            } catch (err) {
                console.error(err);
                alert("Không thể đọc nội dung file này.");
                setPreviewType(null);
            } finally {
                setViewLoading(false);
            }
            return;
        }

        // D. Tải xuống (File khác)
        const downloadUrl = userApi.getDownloadUrl(user, password, relativeFilePath);
        window.open(downloadUrl, '_blank');
    };

    const handleGoBack = () => {
        if (!currentPath) return;
        // Quay lại thư mục cha
        const parts = currentPath.split('/');
        parts.pop();
        setCurrentPath(parts.join('/'));
    };

    const closePreview = () => {
        setPreviewContent(null);
        setPreviewType(null);
    };

    if (!user) return null;
    
    const usedSpace = quota?.used ? parseInt(quota.used) : 0;
    const totalSpace = quota?.total ? parseInt(quota.total) : 0; 
    const freeSpace = quota?.free ? parseInt(quota.free) : 0;

    return (
        <div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <h1>Xin chào, {user}!</h1>
            </div>
            
            {error && <div className="error-message" style={{marginBottom: 20}}>{error}</div>}

            <h2 style={{marginTop:'30px'}}>Dung lượng</h2>
            <div className="file-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'}}>
                <div style={{background:'white', padding:'20px', borderRadius:'8px', border:'1px solid #eee'}}>
                    <div style={{fontWeight:'bold'}}>Đã dùng</div>
                    <div style={{color:'#0070f3', fontSize:'1.2rem'}}>{formatBytes(usedSpace)}</div>
                </div>
                <div style={{background:'white', padding:'20px', borderRadius:'8px', border:'1px solid #eee'}}>
                    <div style={{fontWeight:'bold'}}>Tổng cộng</div>
                    <div style={{color:'#333', fontSize:'1.2rem'}}>{formatBytes(totalSpace)}</div>
                </div>
                <div style={{background:'white', padding:'20px', borderRadius:'8px', border:'1px solid #eee'}}>
                    <div style={{fontWeight:'bold'}}>Còn trống</div>
                    <div style={{color:'green', fontSize:'1.2rem'}}>{formatBytes(freeSpace)}</div>
                </div>
            </div>

            <div style={{display: 'flex', alignItems: 'center', marginTop: '30px', gap: '15px'}}>
                <h2>Danh sách File ({files.length})</h2>
                {currentPath && (
                    <button onClick={handleGoBack} className="btn btn-secondary" style={{padding: '5px 15px', fontSize: '0.9rem'}}>
                        ⬅ Quay lại
                    </button>
                )}
                {currentPath && <span style={{color: '#666'}}>📁 /{currentPath}</span>}
            </div>

            {loading ? (
                <div style={{marginTop: 50}}><Loader /></div>
            ) : files.length === 0 ? (
                <div style={{padding: 30, background: '#f9f9f9', borderRadius: 8, textAlign: 'center', color: '#666', marginTop: 10}}>
                    <p>Thư mục trống.</p>
                </div>
            ) : (
                <div className="file-grid">
                    {files.map((f, i) => (
                        <div key={i} onClick={() => handleItemClick(f)} style={{cursor: 'pointer'}}>
                            <FileCard 
                                // Ưu tiên dùng name từ API, giải mã để hiển thị đẹp
                                name={f.name ? decodeURIComponent(f.name) : getFileNameFromPath(f.path)}
                                size={formatBytes(f.size || 0)} 
                                type={f.type === 'directory' ? 'directory' : 'file'}
                                modified={f.modified} 
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL PREVIEW */}
            {(previewContent || viewLoading) && (
                <div 
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                        background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                    }}
                    onClick={closePreview}
                >
                    <div 
                        style={{
                            background: 'white', padding: '20px', borderRadius: '8px', 
                            maxWidth: '90%', maxHeight: '90%', overflow: 'auto', position: 'relative',
                            minWidth: '300px', minHeight: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center'
                        }}
                        onClick={e => e.stopPropagation()} 
                    >
                        <button 
                            onClick={closePreview}
                            style={{
                                position: 'absolute', top: '10px', right: '10px', 
                                background: '#eee', border: 'none', borderRadius: '50%', 
                                width: '30px', height: '30px', cursor: 'pointer', fontWeight: 'bold', zIndex: 10
                            }}
                        >✕</button>

                        {viewLoading ? (
                            <Loader />
                        ) : previewType === 'image' ? (
                            <img src={previewContent as string} alt="Preview" style={{maxWidth: '100%', maxHeight: '80vh'}} />
                        ) : previewType === 'video' ? (
                            <video src={previewContent as string} controls autoPlay style={{maxWidth: '100%', maxHeight: '80vh'}} />
                        ) : (
                            <pre style={{whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontSize: '0.9rem', color: '#333', textAlign: 'left'}}>
                                {previewContent}
                            </pre>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}