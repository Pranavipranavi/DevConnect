import { DatabaseZap, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import BlogCard from '../components/BlogCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Skeleton from '../components/Skeleton.jsx';
import useDebounce from '../hooks/useDebounce.js';
import useSeo from '../hooks/useSeo.js';
import api from '../services/api.js';

export default function SearchResults() {
  useSeo({
    title: 'Explore Developer Blogs | DevConnect',
    description: 'Search developer articles by title, category, tags, and author on DevConnect.'
  });

  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [sort, setSort] = useState(params.get('sort') || 'latest');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);
  const debounced = useDebounce(query);

  useEffect(() => {
    const next = new URLSearchParams(params);
    if (debounced) next.set('q', debounced); else next.delete('q');
    next.set('sort', sort);
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
  }, [debounced, sort, params, setParams]);

  const loadPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/posts?search=${params.get('q') || ''}&category=${params.get('category') || ''}&tag=${params.get('tag') || ''}&sort=${params.get('sort') || sort}`);
      setPosts(data.posts);
    } catch (err) {
      setError(err.message || 'Could not load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPosts(); }, [params, sort]);

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

  return (
    <section className="container-shell py-10">
      <div className="mb-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-sm font-bold uppercase text-primary">Global Search</p>
          <h1 className="mt-2 text-3xl font-black">Explore Blogs</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="explore-search">Search blogs</label>
          <input id="explore-search" className="input min-w-0 md:w-80" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by title, tag, author" />
          <label className="sr-only" htmlFor="explore-sort">Sort blogs</label>
          <select id="explore-sort" className="input w-44" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="latest">Latest</option>
            <option value="popular">Most Popular</option>
            <option value="viewed">Most Viewed</option>
            <option value="liked">Most Liked</option>
          </select>
          <button type="button" onClick={seedDemo} disabled={seeding} className="btn-primary"><DatabaseZap className="h-4 w-4" /> Sample Data</button>
        </div>
      </div>
      <div className="mb-5 flex items-center gap-2 text-sm text-slate-500"><SlidersHorizontal className="h-4 w-4" /> {posts.length} results</div>
      {error ? <div className="surface flex flex-wrap items-center justify-between gap-4 p-5"><p className="text-sm text-muted-light dark:text-muted-dark">{error}</p><button type="button" onClick={loadPosts} className="btn-secondary"><RefreshCw className="h-4 w-4" /> Retry</button></div> :
        loading ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((item) => <Skeleton key={item} className="h-80" />)}</div> :
        posts.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <BlogCard key={post._id} post={post} />)}</div> :
          <EmptyState title="No posts found" body="Try another keyword, category, or sort option." />}
    </section>
  );
}
