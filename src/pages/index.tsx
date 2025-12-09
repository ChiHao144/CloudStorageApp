import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import FileCard from '../components/FileCard'; 

export default function Dashboard() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    
    useEffect(() => {
        if (!isAuthenticated) router.push('/login');
    }, [isAuthenticated, router]);

    if (!user) return null;

    const mockFiles = [
        { name: 'Photos.zip', size: '5.8 MB' },
        { name: 'Documents.pdf', size: '1.2 MB' },
        { name: 'Videos.mp4', size: '150 MB' },
        { name: 'Report_Q4.xlsx', size: '1.2 KB' }
    ];

    return (
        <div>
            <h1>Welcome back, {user}!</h1>
            
            <h2 style={{marginTop:'30px'}}>Storage Usage (Mock Data)</h2>
            
            <div style={{color:'orange', marginBottom:'20px', padding:'10px', border:'1px dashed orange'}}>
                ⚠️ Tính năng xem dung lượng thực tế đang tạm thời bị vô hiệu hóa do API Backend không tồn tại.
            </div>

            <div className="file-grid">
                {mockFiles.map((f, i) => <FileCard key={i} file={f} />)}
            </div>
        </div>
    );
}