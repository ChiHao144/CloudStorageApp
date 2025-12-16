import React from 'react';
import { FaFolder, FaFileAlt, FaFileImage, FaFileVideo } from 'react-icons/fa';

interface FileCardProps {
    name: string;
    size: string;
    type: 'file' | 'directory';
    modified?: string;
    onDelete?: (e: React.MouseEvent) => void; 
}

const getIconByType = (type: string, name: string) => {
    if (type === 'directory') {
        return <FaFolder className="text-yellow-400 w-10 h-10" />;
    }
    
    const lowerName = name.toLowerCase();
    if (lowerName.match(/\.(jpg|jpeg|png|gif)$/)) {
        return <FaFileImage className="text-purple-500 w-10 h-10" />;
    }
    if (lowerName.match(/\.(mp4|mov|avi)$/)) {
        return <FaFileVideo className="text-red-500 w-10 h-10" />;
    }
    
    return <FaFileAlt className="text-blue-400 w-10 h-10" />;
}

export default function FileCard({ name, size, type, modified, onDelete }: FileCardProps) {
    const displaySize = type === 'file' ? size : 'Folder';

    return (
        <div className="group relative bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer flex flex-col gap-3 h-full">
            {onDelete && (
                <button 
                    onClick={onDelete}
                    className="absolute bottom-2 right-2 p-1.5 rounded-full bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all z-10 shadow-sm border border-gray-100"
                    title="Xóa"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            )}
            <div className="flex items-start justify-between">
                <div className="group-hover:scale-110 transition-transform duration-200">
                    {getIconByType(type, name)}
                </div>
                <div className={`text-xs px-2 py-1 rounded-full font-medium ${type === 'directory' ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-600'}`}>
                    {type === 'directory' ? 'Thư mục' : 'File'}
                </div>
            </div>
            
            <div className="flex-1">
                <h3 className="font-semibold text-gray-800 truncate" title={name}>
                    {name}
                </h3>
                <div className="flex justify-between items-end mt-2">
                    <span className="text-sm text-gray-500 font-medium">{displaySize}</span>
                </div>
            </div>

            {modified && (
                <div className="text-xs text-gray-400 border-t pt-2 mt-1 flex items-center gap-1">
                    {new Date(modified).toLocaleDateString('vi-VN')}
                </div>
            )}
        </div>
    );
}