import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import PageLoader from './PageLoader.jsx';

export default function RoleRoute({ role }) {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!user || user.role !== role) return <Navigate to="/" replace />;
  return <Outlet />;
}
