import { useAuth } from '../context/AuthContext';
import FileCard from '../components/FileCard';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Dashboard() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) router.push('/login');
    }, [isAuthenticated]);

    if (!user) return null;

    const mockFiles = [
        { name: 'Project_A.pdf', size: '2.5 MB' },
        { name: 'Design.png', size: '1.2 MB' },
        { name: 'Report.docx', size: '15 KB' },
        { name: 'Video.mp4', size: '200 MB' }
    ];

    return (
        <div>
            <h1>Welcome back, {user}!</h1>
            <div className="file-grid">
                {mockFiles.map((f, i) => <FileCard key={i} file={f} />)}
            </div>
        </div>
    );
}