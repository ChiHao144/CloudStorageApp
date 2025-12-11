import { useAuth } from '../context/AuthContext';
import FileCard from '../components/FileCard';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { userApi } from '../services/api';
import Loader from '../components/Loader';


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
    name: string; 
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
    const [currentPath, setCurrentPath] = useState('');

    

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        
        const isQuotaResponseValid = (data: unknown): data is { quota: QuotaData } => {
            if (typeof data !== 'object' || data === null) return false;
            const d = data as { quota?: unknown };
            return (
                typeof d.quota === 'object' && 
                d.quota !== null && 
                'used' in (d.quota as object)
            );
        };

        const fetchData = async () => {
            if (!user) return;
            
            const password = localStorage.getItem('password'); 

            if (!password) {
                setError("Vui lòng đăng xuất và đăng nhập lại để xác thực.");
                setLoading(false);
                return;
            }

            setLoading(true);

            try {
                const [quotaRes, filesRes] = await Promise.allSettled([
                    userApi.getQuota(user, password),
                    userApi.getFiles(user, password, currentPath)
                ]);

                if (quotaRes.status === 'fulfilled' && isQuotaResponseValid(quotaRes.value.data)) {
                    setQuota(quotaRes.value.data.quota);
                }

                if (filesRes.status === 'fulfilled') {
                    // Ép kiểu an toàn
                    const data = filesRes.value.data as { files?: unknown };
                    
                    if (data && Array.isArray(data.files)) {
                        const allItems = data.files as FileItem[];
                        const meaningfulItems = allItems.filter(f => {
                            const name = getFileNameFromPath(f.path);
                            
                            return name !== '' && name !== user; 
                        });
                        
                        setFiles(meaningfulItems);
                    }
                } else {
                    console.error("Lỗi lấy Files");
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

    const handleItemClick = (item: FileItem) => {
        if (item.type === 'directory') {
            
            const folderName = getFileNameFromPath(item.path);
            const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
            setCurrentPath(newPath);
        } else {
            
            const fileName = getFileNameFromPath(item.path);
            alert(`Bạn đã chọn file: "${fileName}".\n(Tính năng xem nội dung đang được phát triển)`);
        }
    };

    const handleGoBack = () => {
        if (!currentPath) return;
        const parts = currentPath.split('/');
        parts.pop();
        setCurrentPath(parts.join('/'));
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
                    <div style={{color:'#0070f3', fontSize:'1.2rem'}}>
                        {formatBytes(usedSpace)}
                    </div>
                </div>
                <div style={{background:'white', padding:'20px', borderRadius:'8px', border:'1px solid #eee'}}>
                    <div style={{fontWeight:'bold'}}>Tổng cộng</div>
                    <div style={{color:'#333', fontSize:'1.2rem'}}>
                        {formatBytes(totalSpace)}
                    </div>
                </div>
                <div style={{background:'white', padding:'20px', borderRadius:'8px', border:'1px solid #eee'}}>
                    <div style={{fontWeight:'bold'}}>Còn trống</div>
                    <div style={{color:'green', fontSize:'1.2rem'}}>
                        {formatBytes(freeSpace)}
                    </div>
                </div>
            </div>

            
            <div style={{display: 'flex', alignItems: 'center', marginTop: '30px', gap: '15px'}}>
                <h2>Danh sách File ({files.length})</h2>
                {currentPath && (
                    <button 
                        onClick={handleGoBack}
                        className="btn btn-secondary"
                        style={{padding: '5px 15px', fontSize: '0.9rem'}}
                    >
                        ⬅ Quay lại
                    </button>
                )}
                {currentPath && <span style={{color: '#666'}}>📁 /{currentPath}</span>}
            </div>

            {loading ? (
                <div style={{marginTop: 50}}><Loader /></div>
            ) : files.length === 0 ? (
                <div style={{
                    padding: 30, 
                    background: '#f9f9f9', 
                    borderRadius: 8, 
                    textAlign: 'center',
                    color: '#666',
                    marginTop: 10
                }}>
                    <p>Thư mục trống.</p>
                </div>
            ) : (
                <div className="file-grid">
                    {files.map((f, i) => (
                        <div key={i} onClick={() => handleItemClick(f)} style={{cursor: 'pointer'}}>
                            <FileCard 
                                name={getFileNameFromPath(f.path)}
                                size={formatBytes(f.size || 0)} 
                                type={f.type === 'directory' ? 'directory' : 'file'}
                                modified={f.modified} 
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}