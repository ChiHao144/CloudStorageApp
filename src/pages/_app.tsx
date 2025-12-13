import type { AppProps } from 'next/app';
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/globals.css';

export default function MyApp({ Component, pageProps }: AppProps) {
    return (
        <AuthProvider>
            <div className="flex flex-col min-h-screen bg-gray-50">
                
                <Navbar />
                <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <Component {...pageProps} />
                </main>

                <Footer />
            </div>
        </AuthProvider>
    );
}