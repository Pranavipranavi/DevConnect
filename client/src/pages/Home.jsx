import { ArrowRight, BookOpen, Code2, DatabaseZap, Hash, Mail, RefreshCw, Sparkles, TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import BlogCard from '../components/BlogCard.jsx';
import Skeleton from '../components/Skeleton.jsx';
import useSeo from '../hooks/useSeo.js';
import api from '../services/api.js';
import { compactNumber } from '../utils/format.js';

export default function Home() {
  useSeo({
    title: 'DevConnect | Premium Developer Blogging Platform',
    description: 'Publish developer articles, discover practical engineering ideas, and build your technical reputation with DevConnect.'
  });

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);

  const loadPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/posts?limit=9&sort=latest');
      setPosts(data.posts);
    } catch (err) {
      setError(err.message || 'Could not load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPosts(); }, []);

  const seedDemo = async () => {
    setSeeding(true);
    try {
      const { data } = await api.post('/seed/demo');
      toast.success(data.message);
      await loadPosts();
    } catch (err) {
      toast.error(err.message || 'Could not generate sample data');
    } finally {
      setSeeding(false);
    }
  };

  const categories = useMemo(() => [...new Set(posts.map((post) => post.category))].slice(0, 8), [posts]);
  const authors = useMemo(() => {
    const seen = new Set();
    return posts.map((post) => post.author).filter((author) => {
      if (!author?._id || seen.has(author._id)) return false;
      seen.add(author._id);
      return true;
    }).slice(0, 4);
  }, [posts]);
  const stats = useMemo(() => ({
    posts: posts.length || 30,
    authors: authors.length || 8,
    views: posts.reduce((sum, post) => sum + (post.views || 0), 0) || 4200
  }), [posts, authors.length]);

  return (
    <>
      <section className="relative overflow-hidden border-b border-border-light bg-gradient-to-br from-sky-50 via-white to-pink-50 py-16 dark:border-border-dark dark:from-[#0F172A] dark:via-surface-dark dark:to-slate-900 sm:py-20">
        <motion.div aria-hidden="true" className="absolute left-8 top-16 h-16 w-16 rotate-12 rounded-md border border-primary/30" animate={{ y: [0, -12, 0], rotate: [12, 18, 12] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div aria-hidden="true" className="absolute bottom-16 right-12 h-20 w-20 rounded-md border border-secondary/40" animate={{ y: [0, 14, 0], rotate: [0, -10, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
        <div className="container-shell relative grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-primary dark:border-blue-900 dark:bg-blue-950/50">
              <Sparkles className="h-4 w-4" /> Premium developer publishing
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-text-light dark:text-text-dark sm:text-5xl lg:text-6xl">Where Developers Share Knowledge</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">Publish articles, learn from others, and build your professional presence.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/create" className="btn-primary">Start Writing <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/search" className="btn-secondary">Explore Blogs</Link>
              <button type="button" onClick={seedDemo} disabled={seeding} className="btn-secondary"><DatabaseZap className="h-4 w-4" /> Sample Data</button>
            </div>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              {[
                ['Articles', stats.posts, BookOpen],
                ['Authors', stats.authors, Users],
                ['Views', stats.views, TrendingUp]
              ].map(([label, value, Icon]) => (
                <motion.div key={label} className="surface p-4" whileHover={{ y: -4 }}>
                  <Icon className="mb-2 h-4 w-4 text-primary" />
                  <p className="text-xl font-black">{compactNumber(value)}</p>
                  <p className="text-xs font-semibold text-muted-light dark:text-muted-dark">{label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
          <motion.div className="surface p-4" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, delay: 0.08 }}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-black">Editor picks</p>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-primary dark:bg-slate-800">Live feed</span>
            </div>
            <div className="grid gap-3">
              {(posts[0] ? posts.slice(0, 3) : [1, 2, 3]).map((post, index) => (
                post.title ? (
                  <Link key={post._id} to={`/blogs/${post.slug}`} className="rounded-md border border-slate-100 p-4 transition hover:border-primary dark:border-slate-800">
                    <p className="text-xs font-bold uppercase text-primary">{post.category}</p>
                    <h3 className="mt-2 font-black">{post.title}</h3>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{post.author?.name} - {post.readingTime} min read</p>
                  </Link>
                ) : <Skeleton key={index} className="h-24" />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container-shell py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Featured Articles</p>
            <h2 className="section-title mt-2">Recent thinking from developers</h2>
          </div>
          <Link to="/search" className="hidden text-sm font-semibold text-primary sm:inline">View all</Link>
        </div>
        {error ? (
          <div className="surface flex flex-wrap items-center justify-between gap-4 p-5">
            <p className="text-sm text-muted-light dark:text-muted-dark">{error}</p>
            <button type="button" onClick={loadPosts} className="btn-secondary"><RefreshCw className="h-4 w-4" /> Retry</button>
          </div>
        ) : loading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-80" />)}</div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <BlogCard key={post._id} post={post} />)}</div>
        )}
      </section>

      <section className="border-y border-border-light bg-white/70 py-14 dark:border-border-dark dark:bg-surface-dark">
        <div className="container-shell grid gap-8 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold uppercase text-primary"><Hash className="h-4 w-4" /> Trending Categories</div>
            <div className="mt-5 flex flex-wrap gap-3">
              {(categories.length ? categories : ['React', 'Node.js', 'MongoDB', 'Career']).map((category) => (
                <Link key={category} to={`/search?category=${category}`} className="rounded-md border border-border-light bg-white px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-primary hover:shadow-sm dark:border-border-dark dark:bg-surface-card">{category}</Link>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm font-bold uppercase text-primary"><Users className="h-4 w-4" /> Top Authors</div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {(authors.length ? authors : [{ name: 'DevConnect Author', _id: 'sample' }]).map((author, index) => (
                <Link key={`${author._id}-${index}`} to={`/profile/${author._id}`} className="surface p-4 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-primary">
                  <span className="block">{author.name}</span>
                  <span className="mt-1 block text-xs font-medium text-muted-light dark:text-muted-dark">Top contributor</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell py-12">
        <div className="grid gap-4 rounded-lg bg-gradient-to-r from-slate-950 via-slate-900 to-sky-900 p-6 text-white md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex items-start gap-3">
            <Code2 className="mt-1 h-6 w-6 text-accent" />
            <div>
              <h2 className="text-2xl font-black">Build reputation with every post</h2>
              <p className="mt-2 text-slate-300">Draft, publish, discuss, and track performance from one polished workspace.</p>
            </div>
          </div>
          <Link to="/register" className="btn-primary bg-white text-secondary hover:bg-slate-100">Create Account</Link>
        </div>
      </section>

      <section className="container-shell pb-14">
        <div className="surface grid gap-5 p-6 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-sky-50 text-primary dark:bg-slate-800">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="eyebrow">Newsletter</p>
              <h2 className="mt-1 text-2xl font-black">Get the best developer reads every week</h2>
              <p className="mt-2 text-sm text-muted-light dark:text-muted-dark">A concise digest of engineering articles, product thinking, and portfolio-ready ideas.</p>
            </div>
          </div>
          <form onSubmit={(event) => { event.preventDefault(); toast.success('You are on the list'); }} className="flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="newsletter-email">Email address</label>
            <input id="newsletter-email" type="email" required className="input sm:w-72" placeholder="you@example.com" />
            <button className="btn-primary" type="submit">Subscribe</button>
          </form>
        </div>
      </section>
    </>
  );
}
