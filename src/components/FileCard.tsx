interface FileProps {
    name: string;
    size: string;
}

export default function FileCard({ file }: { file: FileProps }) {
    return (
        <div className="file-card"> 
            <div className="file-icon">📁</div> 
            <div className="file-name">{file.name}</div>
            <div className="file-size">{file.size}</div>
        </div>
    );
}