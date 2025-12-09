import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { userApi } from '../services/api'; 
export default function Upload() {
    const { user, isAuthenticated } = useAuth(); 
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

    const handleUpload = async () => {
        if (!selectedFile || !user || !password) {
            alert("Vui lòng chọn file và nhập mật khẩu.");
            return;
        }
        
        const originalFileName = selectedFile.name;
        
        try {
            alert(`Đang tải lên file: ${originalFileName}...`);
            
            await userApi.uploadFile(selectedFile, user, password); 
            
            alert(`Tải lên thành công: ${originalFileName}!`);
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
        } finally {
           
        }
    };

    return (
        <div>
            <h1>Upload File cho {user}</h1>
            
            <div className="input-group" style={{marginBottom: '20px'}}>
                <label>Nhập lại Mật khẩu để Xác thực</label>
                <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                    style={{width: '100%'}}
                />
            </div>
            <div 
                style={{
                    height: '300px', 
                    border: `2px dashed ${dragActive ? '#0070f3' : '#ccc'}`, 
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: dragActive ? '#f0f8ff' : 'white',
                    transition: 'all 0.2s'
                }}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <div style={{fontSize: '3rem', color: '#ccc'}}>⬆️</div>
                <p>Drag and drop a file here</p>
                <p>or</p>
                <label htmlFor="file-upload" className="btn btn-secondary">
                    Select a file
                </label>
                <input 
                    id="file-upload" 
                    type="file" 
                    style={{display: 'none'}} 
                    onChange={handleChange} 
                />
            </div>
            
            {selectedFile && (
                <div style={{marginTop: '20px', textAlign: 'center'}}>
                    <p>File đã chọn: <strong>{selectedFile.name}</strong></p>
                    <button onClick={handleUpload} className="btn btn-primary" disabled={!password}>
                        Upload File
                    </button>
                </div>
            )}
        </div>
    );
}