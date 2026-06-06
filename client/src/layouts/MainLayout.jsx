import { Outlet } from 'react-router-dom';
import Footer from '../components/Footer.jsx';
import Navbar from '../components/Navbar.jsx';
import OfflineBanner from '../components/OfflineBanner.jsx';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-canvas text-text-light transition dark:bg-[#0F172A] dark:text-text-dark">
      <OfflineBanner />
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
