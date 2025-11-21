import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    return (
        <nav className="navbar">
            <div className="container nav-container">
                <div style={{fontWeight:'bold', fontSize:'1.5rem', color:'#0070f3'}}>☁️ CloudBox</div>
                <div className="nav-links">
                    {user ? (
                        <>
                            <Link href="/">Dashboard</Link>
                            <Link href="/upload">Upload</Link>
                            <span>Hi, {user}</span>
                            <span onClick={logout} style={{color:'red'}}>Logout</span>
                        </>
                    ) : (
                        <>
                            <Link href="/login">Login</Link>
                            <Link href="/register">Register</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}