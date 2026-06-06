import { Eye, FileText, Github, Globe, Heart, Linkedin, Save, Twitter } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import Avatar from '../components/Avatar.jsx';
import BlogCard from '../components/BlogCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import PageLoader from '../components/PageLoader.jsx';
import StatCard from '../components/StatCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import useSeo from '../hooks/useSeo.js';

export default function Profile() {
  const { id } = useParams();
  const { user: authUser, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [avatar, setAvatar] = useState(null);
  const [error, setError] = useState('');
  const isOwnProfile = !id || id === authUser?._id;

  useSeo({
    title: profile ? `${profile.user.name} | DevConnect` : 'Profile | DevConnect',
    description: profile?.user.bio || 'Developer profile on DevConnect.'
  });

  const load = () => {
    setError('');
    return api.get(id ? `/users/${id}` : '/users/profile').then(({ data }) => {
    setProfile(data);
    setForm({
      name: data.user.name || '',
      bio: data.user.bio || '',
      linkedin: data.user.socialLinks?.linkedin || '',
      github: data.user.socialLinks?.github || '',
      twitter: data.user.socialLinks?.twitter || '',
      portfolio: data.user.socialLinks?.portfolio || ''
    });
    }).catch((err) => setError(err.message || 'Could not load profile'));
  };

  useEffect(() => { load(); }, [id]);

  const submit = async (event) => {
    event.preventDefault();
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value || ''));
    if (avatar) data.append('avatar', avatar);
    const response = await api.put('/users/profile', data);
    setUser(response.data.user);
    toast.success('Profile updated');
    load();
  };

  if (error && !profile) return <section className="container-shell py-10"><ErrorState message={error} onRetry={load} /></section>;
  if (!profile) return <PageLoader />;

  const links = [
    ['linkedin', Linkedin],
    ['github', Github],
    ['twitter', Twitter],
    ['portfolio', Globe]
  ];

  return (
    <section className="container-shell py-10">
      <motion.div className="surface overflow-hidden" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <div className="h-36 bg-gradient-to-r from-sky-300 via-pink-200 to-orange-100 dark:from-blue-900 dark:via-slate-900 dark:to-fuchsia-900" />
        <div className="p-6">
          <div className="-mt-16 flex flex-wrap items-end justify-between gap-4">
            <Avatar user={profile.user} size="h-28 w-28 border-4 border-white dark:border-slate-950" />
            <div className="flex gap-2">
              {links.map(([key, Icon]) => profile.user.socialLinks?.[key] && (
                <a key={key} href={profile.user.socialLinks[key]} target="_blank" rel="noreferrer" className="btn-secondary px-3" aria-label={`${key} profile`}><Icon className="h-4 w-4" /></a>
              ))}
            </div>
          </div>
          <h1 className="mt-4 text-3xl font-black">{profile.user.name}</h1>
          <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">{profile.user.bio || 'Developer writer building in public.'}</p>
        </div>
      </motion.div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard icon={FileText} label="Total Posts" value={profile.stats.totalPosts} />
        <StatCard icon={Heart} label="Total Likes" value={profile.stats.totalLikes} />
        <StatCard icon={Eye} label="Total Views" value={profile.stats.totalViews} />
      </div>

      {isOwnProfile && (
        <form onSubmit={submit} className="surface mt-6 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Settings</p>
              <h2 className="mt-1 text-xl font-black">Profile Settings</h2>
            </div>
            <button className="btn-primary"><Save className="h-4 w-4" /> Save Profile</button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2"><span className="label">Name</span><input className="input" value={form.name || ''} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label className="grid gap-2"><span className="label">Avatar</span><input className="input" type="file" accept="image/*" onChange={(event) => setAvatar(event.target.files?.[0] || null)} /></label>
            <label className="grid gap-2 md:col-span-2"><span className="label">Bio</span><textarea className="input min-h-24" value={form.bio || ''} onChange={(event) => setForm({ ...form, bio: event.target.value })} /></label>
            {links.map(([key]) => <label key={key} className="grid gap-2"><span className="label">{key[0].toUpperCase() + key.slice(1)}</span><input className="input" value={form[key] || ''} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></label>)}
          </div>
        </form>
      )}

      <div className="mt-8">
        <div className="mb-4">
          <p className="eyebrow">Recent Posts</p>
          <h2 className="section-title mt-1">Published Blogs</h2>
        </div>
        {profile.posts.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{profile.posts.map((post) => <BlogCard key={post._id} post={post} />)}</div> : <EmptyState title="No published blogs" body="Published articles will appear here." />}
      </div>
    </section>
  );
}
