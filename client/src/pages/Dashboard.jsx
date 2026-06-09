import { Bookmark, Eye, FileText, Heart, MessageCircle, Pencil, Plus, Settings, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState.jsx';
import BlogCard from '../components/BlogCard.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import DashboardCharts from '../components/DashboardCharts.jsx';
import ErrorState from '../components/ErrorState.jsx';
import PageLoader from '../components/PageLoader.jsx';
import StatCard from '../components/StatCard.jsx';
import api from '../services/api.js';
import useSeo from '../hooks/useSeo.js';
import { compactNumber, formatDate } from '../utils/format.js';

export default function Dashboard() {
  useSeo({
    title: 'Dashboard | DevConnect',
    description: 'Manage articles, drafts, saved posts, and performance analytics in your DevConnect dashboard.'
  });

  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    setError('');
    return api.get('/users/dashboard')
      .then(({ data: result }) => setData(result))
      .catch((err) => {
        const message = err.message || 'Could not load dashboard';
        setError(message);
        toast.error(message);
      });
  };

  useEffect(() => { load(); }, []);

  const deletePost = async (id) => {
    try {
      await api.delete(`/posts/${id}`);
      toast.success('Post deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Could not delete post');
    }
  };

  if (error && !data) return <section className="container-shell py-10"><ErrorState message={error} onRetry={load} /></section>;
  if (!data) return <PageLoader />;

  const posts = data.posts.filter((post) => filter === 'all' || post.status === filter);

  return (
    <section className="container-shell py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Dashboard</h1>
          <p className="mt-2 text-sm text-muted-light dark:text-muted-dark">Track publishing performance, manage drafts, and jump into common actions.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/profile" className="btn-secondary"><Settings className="h-4 w-4" /> Profile</Link>
          <Link to="/create" className="btn-primary"><Plus className="h-4 w-4" /> New Blog</Link>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={FileText} label="Total Blogs" value={data.stats.totalBlogs} />
        <StatCard icon={Heart} label="Total Likes" value={data.stats.totalLikes} />
        <StatCard icon={Eye} label="Total Views" value={data.stats.totalViews} />
        <StatCard icon={MessageCircle} label="Comments" value={data.stats.totalComments} />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <DashboardCharts posts={data.posts} />
        <aside className="surface p-5">
          <p className="eyebrow">Quick Actions</p>
          <div className="mt-4 grid gap-3">
            <Link to="/create" className="btn-primary justify-start"><Plus className="h-4 w-4" /> Write new article</Link>
            <button type="button" onClick={() => setFilter('draft')} className="btn-secondary justify-start"><FileText className="h-4 w-4" /> Review drafts</button>
            <button type="button" onClick={() => setFilter('bookmarks')} className="btn-secondary justify-start"><Bookmark className="h-4 w-4" /> Open saved posts</button>
          </div>
          <div className="mt-6">
            <p className="text-sm font-black">Recent activity</p>
            <div className="mt-3 grid gap-3">
              {data.posts.slice(0, 4).map((post) => (
                <Link key={post._id} to={`/blogs/${post.slug}`} className="rounded-md border border-border-light p-3 text-sm transition hover:border-primary dark:border-border-dark">
                  <span className="block truncate font-semibold">{post.title}</span>
                  <span className="mt-1 block text-xs text-muted-light dark:text-muted-dark">{compactNumber(post.views)} views - {formatDate(post.updatedAt)}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
      <div className="my-6 flex flex-wrap gap-2">
        {['all', 'published', 'draft', 'bookmarks'].map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={filter === item ? 'btn-primary' : 'btn-secondary'}>{item[0].toUpperCase() + item.slice(1)}</button>)}
      </div>
      {filter === 'bookmarks' ? (
        data.bookmarks?.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{data.bookmarks.map((post) => <BlogCard key={post._id} post={post} />)}</div> : <EmptyState title="No bookmarks yet" body="Save posts from Blog Details and they will appear here." />
      ) : posts.length === 0 ? <EmptyState title="No blogs in this view" body="Create a draft or publish your next article." action="Create Blog" to="/create" /> : (
        <div className="surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900">
                <tr><th className="p-4">Title</th><th>Status</th><th>Views</th><th>Likes</th><th>Updated</th><th className="text-right pr-4">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {posts.map((post) => (
                  <tr key={post._id}>
                    <td className="p-4 font-semibold"><Link to={`/blogs/${post.slug}`}>{post.title}</Link></td>
                    <td><span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold dark:bg-slate-800">{post.status}</span></td>
                    <td>{compactNumber(post.views)}</td>
                    <td>{compactNumber(post.likes)}</td>
                    <td>{formatDate(post.updatedAt)}</td>
                    <td className="pr-4 text-right">
                      <Link to={`/edit/${post._id}`} className="mr-3 inline-flex text-primary"><Pencil className="h-4 w-4" /></Link>
                      <button type="button" onClick={() => setDeleteTarget(post)} className="rounded-md p-2 text-red-500 transition hover:bg-rose-50" aria-label={`Delete ${post.title}`}><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete blog?"
        body={deleteTarget ? `This will permanently remove "${deleteTarget.title}" and its comments, likes, and bookmarks.` : ''}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deletePost(deleteTarget._id)}
      />
    </section>
  );
}
