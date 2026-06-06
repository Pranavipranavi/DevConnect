import { Eye, FileText, MessageCircle, Shield, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageLoader from '../components/PageLoader.jsx';
import ErrorState from '../components/ErrorState.jsx';
import StatCard from '../components/StatCard.jsx';
import api from '../services/api.js';
import { formatDate } from '../utils/format.js';

export default function AdminDashboard() {
  const [users, setUsers] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const [userRes, analyticsRes] = await Promise.all([api.get('/admin/users'), api.get('/admin/analytics')]);
      setUsers(userRes.data.users);
      setStats(analyticsRes.data.stats);
    } catch (err) {
      setError(err.message || 'Could not load admin dashboard');
    }
  };

  useEffect(() => { load(); }, []);

  const deleteUser = async (id) => {
    await api.delete(`/admin/user/${id}`);
    toast.success('User deleted');
    load();
  };

  if (error && (!users || !stats)) return <section className="container-shell py-10"><ErrorState message={error} onRetry={load} /></section>;
  if (!users || !stats) return <PageLoader />;

  return (
    <section className="container-shell py-10">
      <div className="mb-6">
        <p className="flex items-center gap-2 text-sm font-bold uppercase text-primary"><Shield className="h-4 w-4" /> Admin</p>
        <h1 className="mt-2 text-3xl font-black">Admin Dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} />
        <StatCard icon={FileText} label="Total Blogs" value={stats.totalBlogs} />
        <StatCard icon={MessageCircle} label="Comments" value={stats.totalComments} />
        <StatCard icon={Eye} label="Views" value={stats.totalViews} />
      </div>
      <div className="surface mt-6 overflow-hidden">
        <div className="border-b border-slate-100 p-5 dark:border-slate-800">
          <h2 className="text-xl font-black">Manage Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900">
              <tr><th className="p-4">Name</th><th>Email</th><th>Role</th><th>Joined</th><th className="text-right pr-4">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((user) => (
                <tr key={user._id}>
                  <td className="p-4 font-semibold">{user.name}</td>
                  <td>{user.email}</td>
                  <td><span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold dark:bg-slate-800">{user.role}</span></td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td className="pr-4 text-right"><button type="button" onClick={() => deleteUser(user._id)} className="text-red-500"><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
