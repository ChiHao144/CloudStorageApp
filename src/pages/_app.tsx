import type { AppProps } from 'next/app';
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/globals.css';

export default function MyApp({ Component, pageProps }: AppProps) {
    return (
        <AuthProvider>
            <Navbar />
            <div className="container" style={{minHeight: '60vh'}}>
                <Component {...pageProps} />
            </div>
            <Footer />
        </AuthProvider>
    );
}