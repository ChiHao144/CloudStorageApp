import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    return (
        <nav className="navbar">
            <div className="container nav-container">
                <div className="nav-brand">☁️ CloudBox</div> 
                
                <div className="nav-links">
                    {user ? (
                        <>
                            <Link href="/" className="nav-link">Dashboard</Link>
                            <Link href="/upload" className="nav-link">Upload</Link>
                            <Link href="/payment" className="nav-link">Payment</Link>
                            
                            <span className="nav-link nav-username">Hi, {user}</span>
                            <span onClick={logout} className="nav-link logout-link">Logout</span>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="nav-link">Login</Link>
                            <Link href="/register" className="nav-link">Register</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}