import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    
    return (
        <nav className="bg-white shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
                        <span className="text-3xl">☁️</span>
                        <span className="font-bold text-xl text-blue-600 tracking-tight">CloudBox</span>
                    </div>

                    {/* Links */}
                    <div className="flex items-center gap-6">
                        {user ? (
                            <>
                                <Link href="/" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                                    Dashboard
                                </Link>
                                <Link href="/upload" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                                    Upload
                                </Link>
                                <Link href="/payment" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                                    Payment
                                </Link>
                                
                                <div className="hidden md:flex items-center gap-4 ml-4 pl-4 border-l border-gray-200">
                                    <span className="text-sm text-gray-500">Xin chào, <span className="font-semibold text-gray-800">{user}</span></span>
                                    <button 
                                        onClick={logout} 
                                        className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                                    >
                                        Đăng xuất
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex gap-3">
                                <Link href="/login" className="text-gray-600 hover:text-blue-600 font-medium px-3 py-2">
                                    Đăng nhập
                                </Link>
                                <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">
                                    Đăng ký
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}