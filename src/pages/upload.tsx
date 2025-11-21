import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';

export default function Upload() {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
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

    const handleUpload = () => {
        if (!selectedFile) return;
        alert(`Giả lập upload file: ${selectedFile.name}\n(Cần backend implement API upload để hoạt động thật)`);
        // Sau này gọi userApi.uploadFile(formData) ở đây
    };

    return (
        <div>
            <h1>Upload</h1>
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
                    <p>Selected: <strong>{selectedFile.name}</strong></p>
                    <button onClick={handleUpload} className="btn btn-primary">Upload File</button>
                </div>
            )}
        </div>
    );
}