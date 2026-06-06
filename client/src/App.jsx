import { lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Route, Routes, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RoleRoute from './components/RoleRoute.jsx';
import PageLoader from './components/PageLoader.jsx';

const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const BlogDetails = lazy(() => import('./pages/BlogDetails.jsx'));
const CreateBlog = lazy(() => import('./pages/CreateBlog.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const EditBlog = lazy(() => import('./pages/EditBlog.jsx'));
const Home = lazy(() => import('./pages/Home.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const SearchResults = lazy(() => import('./pages/SearchResults.jsx'));

const Page = ({ children }) => (
  <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.28, ease: 'easeOut' }}>
    {children}
  </motion.div>
);

export default function App() {
  const location = useLocation();

  return (
    <Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Page><Home /></Page>} />
            <Route path="/login" element={<Page><Login /></Page>} />
            <Route path="/register" element={<Page><Register /></Page>} />
            <Route path="/blogs/:id" element={<Page><BlogDetails /></Page>} />
            <Route path="/search" element={<Page><SearchResults /></Page>} />
            <Route path="/profile/:id?" element={<Page><Profile /></Page>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/create" element={<Page><CreateBlog /></Page>} />
              <Route path="/edit/:id" element={<Page><EditBlog /></Page>} />
              <Route path="/dashboard" element={<Page><Dashboard /></Page>} />
            </Route>
            <Route element={<RoleRoute role="admin" />}>
              <Route path="/admin" element={<Page><AdminDashboard /></Page>} />
            </Route>
            <Route path="*" element={<Page><NotFound /></Page>} />
          </Route>
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}
