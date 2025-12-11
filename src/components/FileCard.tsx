import React from 'react';

interface FileCardProps {
    name: string;
    size: string;
    type: 'file' | 'directory';
    modified: string; 
}


const getIconByType = (type: string) => {
    if (type === 'directory') {
        return '📁'; 
    }
   
    return '📄'; 
}


const formatModifiedDate = (dateString: string) => {
    try {
        
        return new Date(dateString).toLocaleString();
    } catch {
        return dateString;
    }
}

export default function FileCard({ name, size, type, modified }: FileCardProps) {
    
    const displaySize = type === 'file' ? size : '— Folder';

    return (
        <div className="file-card-wrapper">
            
            <div className="file-icon" style={{fontSize: '1.5rem'}}>
                {getIconByType(type)}
            </div>
            
            
            <div className="file-content">
                <div className="file-name" style={{fontWeight: 'bold'}}>
                    {name}
                </div>
                <div className="file-size" style={{fontSize: '0.85rem', color: '#666'}}>
                    {displaySize}
                </div>
               
                <div className="file-modified" style={{fontSize: '0.75rem', color: '#999'}}>
                    Cập nhật: {formatModifiedDate(modified)}
                </div>
            </div>
        </div>
    );
}