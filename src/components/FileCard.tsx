import React from 'react';
import { FaFolder, FaFileAlt, FaFileImage, FaFileVideo } from 'react-icons/fa';
import { FiMove } from 'react-icons/fi';

interface FileCardProps {
    name: string;
    size: string;
    type: 'file' | 'directory';
    modified?: string;
    onDelete?: (e: React.MouseEvent) => void;
    onDownload?: (e: React.MouseEvent) => void;
    onShare?: (e: React.MouseEvent) => void;
    onMove?: (e: React.MouseEvent) => void;
}

const getIconByType = (type: string, name: string) => {
    if (type === 'directory') return <FaFolder className="text-yellow-400 w-10 h-10" />;

    const lowerName = name.toLowerCase();
    if (lowerName.match(/\.(jpg|jpeg|png|gif)$/)) return <FaFileImage className="text-purple-500 w-10 h-10" />;
    if (lowerName.match(/\.(mp4|mov|avi)$/)) return <FaFileVideo className="text-red-500 w-10 h-10" />;
    return <FaFileAlt className="text-blue-400 w-10 h-10" />;
};

export default function FileCard({ name, size, type, modified, onDelete, onDownload, onShare, onMove }: FileCardProps) {
    const displaySize = type === 'file' ? size : 'Folder';

    return (
        <div className="group relative bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer flex flex-col gap-3 h-full">
            
            {/* Action buttons */}
            {(onDelete || onDownload || onShare || onMove) && (
                <div className="absolute bottom-1.5 right-1.5 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">

                    {onMove && (
                        <button
                            onClick={onMove}
                            className="p-1.5 rounded-full bg-white text-gray-400 hover:text-green-600 hover:bg-green-50 shadow-sm border border-gray-100"
                            title="Di chuyển"
                        >
                            <FiMove className="h-4 w-4" />
                        </button>
                    )}

                    {onShare && (
                        <button
                            onClick={onShare}
                            className="p-1.5 rounded-full bg-white text-gray-400 hover:text-blue-500 hover:bg-blue-50 shadow-sm border border-gray-100"
                            title="Chia sẻ"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="h-4 w-4" fill="currentColor">
                                <path d="M352 320c-22.6 0-43.4 9.4-58.3 24.6L154.6 256.1c1.1-5.3 1.7-10.7 1.7-16.1s-.6-10.8-1.7-16.1l139.1-88.5C308.6 150.6 329.4 160 352 160c53 0 96-43 96-96S405-32 352-32s-96 43-96 96c0 5.4.6 10.8 1.7 16.1L118.6 168.6C103.7 153.4 82.9 144 60.3 144 7.3 144-35.7 187-35.7 240s43 96 96 96c22.6 0 43.4-9.4 58.3-24.6l139.1 88.5c-1.1 5.1-1.7 10.5-1.7 15.9 0 53 43 96 96 96s96-43 96-96-43-96-96-96z"/>
                            </svg>
                        </button>
                    )}

                    {onDownload && (
                        <button
                            onClick={onDownload}
                            className="p-1.5 rounded-full bg-white text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 shadow-sm border border-gray-100"
                            title="Tải về"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>
                    )}

                    {onDelete && (
                        <button
                            onClick={onDelete}
                            className="p-1.5 rounded-full bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 shadow-sm border border-gray-100"
                            title="Xóa"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>
            )}

            {/* File icon and type */}
            <div className="flex items-start justify-between">
                <div className="group-hover:scale-110 transition-transform duration-200">{getIconByType(type, name)}</div>
                <div className={`text-xs px-2 py-1 rounded-full font-medium ${type === 'directory' ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-600'}`}>
                    {type === 'directory' ? 'Thư mục' : 'File'}
                </div>
            </div>

            {/* Name & size */}
            <div className="flex-1">
                <h3 className="font-semibold text-gray-800 truncate" title={name}>{name}</h3>
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