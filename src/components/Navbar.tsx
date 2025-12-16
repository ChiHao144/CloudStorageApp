import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { MdOutlineWbCloudy } from "react-icons/md";
import Swal from 'sweetalert2';

export default function Navbar() {
    const { user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMenu = () => setIsMobileMenuOpen(false);

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: 'Đăng xuất?',
            text: "Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Đăng xuất',
            cancelButtonText: 'Ở lại'
        });

        if (result.isConfirmed) {
            logout();
            closeMenu();
            Swal.fire({
                title: 'Đã đăng xuất!',
                text: 'Hẹn gặp lại bạn sớm.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        }
    };

    return (
        <nav className="bg-white shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
                        <MdOutlineWbCloudy className="text-3xl text-blue-600" />
                        <span className="font-bold text-xl text-blue-600 tracking-tight">CloudBox</span>
                    </div>

                    <div className="hidden md:flex items-center gap-6">
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

                                <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-200">
                                    <span className="text-sm text-gray-500">Xin chào, <span className="font-semibold text-gray-800">{user}</span></span>
                                    <button
                                        onClick={handleLogout}
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

                    <div className="flex md:hidden items-center">
                        <button
                            onClick={toggleMenu}
                            className="text-gray-500 hover:text-gray-700 focus:outline-none p-2 rounded-md hover:bg-gray-100"
                        >
                            {isMobileMenuOpen ? (
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div className="md:hidden border-t border-gray-100 bg-white absolute w-full shadow-lg">
                    <div className="px-4 pt-2 pb-4 space-y-1 sm:px-3">
                        {user ? (
                            <>
                                <div className="px-3 py-2 text-sm text-gray-500 border-b border-gray-100 mb-2">
                                    Xin chào, <span className="font-bold text-gray-800">{user}</span>
                                </div>
                                <Link href="/" onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50">
                                    Dashboard
                                </Link>
                                <Link href="/upload" onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50">
                                    Upload
                                </Link>
                                <Link href="/payment" onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50">
                                    Payment
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left mt-2 block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                                >
                                    Đăng xuất
                                </button>
                            </>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 px-2 pt-2">
                                <Link href="/login" onClick={closeMenu} className="block text-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                                    Đăng nhập
                                </Link>
                                <Link href="/register" onClick={closeMenu} className="block text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    Đăng ký
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}