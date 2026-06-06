import { Bookmark, Edit, Eye, Heart, Linkedin, Link as LinkIcon, MessageCircle, Reply, Send, Share2, Trash2, Twitter } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Avatar from '../components/Avatar.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import PageLoader from '../components/PageLoader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import useSeo from '../hooks/useSeo.js';
import { compactNumber, formatDate } from '../utils/format.js';

export default function BlogDetails() {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [comment, setComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [related, setRelated] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const loadPost = () => {
    setError('');
    return api.get(`/posts/${id}`).then(({ data }) => {
      setPost(data.post);
      setComments(data.comments);
      setLiked(data.liked);
      setBookmarked(data.bookmarked);
    }).catch((err) => {
      setError(err.message || 'Post not found');
      toast.error(err.message || 'Post not found');
    });
  };

  useEffect(() => { loadPost(); }, [id]);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!post?.category) return;
    api.get(`/posts?category=${encodeURIComponent(post.category)}&limit=4&autoSeed=false`)
      .then(({ data }) => setRelated(data.posts.filter((item) => item._id !== post._id).slice(0, 3)))
      .catch(() => setRelated([]));
  }, [post?.category, post?._id]);

  useSeo({
    title: post ? `${post.title} | DevConnect` : 'Blog | DevConnect',
    description: post ? `${post.title} by ${post.author?.name || 'DevConnect author'}` : 'Read developer articles on DevConnect.',
    image: post?.coverImage
  });

  const canManage = useMemo(() => user && post && (user.role === 'admin' || user._id === post.author?._id), [user, post]);

  const toggleLike = async () => {
    if (!user) return navigate('/login');
    try {
      const { data } = await api.post(`/likes/${post._id}`);
      setLiked(data.liked);
      setPost((current) => ({ ...current, likes: data.likes }));
    } catch (error) {
      toast.error(error.message || 'Could not update like');
    }
  };

  const toggleBookmark = async () => {
    if (!user) return navigate('/login');
    try {
      const { data } = await api.post(`/bookmarks/${post._id}`);
      setBookmarked(data.bookmarked);
      toast.success(data.bookmarked ? 'Bookmarked' : 'Bookmark removed');
    } catch (error) {
      toast.error(error.message || 'Could not update bookmark');
    }
  };

  const submitComment = async (event) => {
    event.preventDefault();
    if (!user) return navigate('/login');
    if (!comment.trim()) return;
    try {
      const { data } = await api.post('/comments', { postId: post._id, comment, parentComment: replyTo?._id });
      setComments((current) => [...current, data.comment]);
      setComment('');
      setReplyTo(null);
      toast.success(replyTo ? 'Reply added' : 'Comment added');
    } catch (error) {
      toast.error(error.message || 'Could not add comment');
    }
  };

  const deletePost = async () => {
    await api.delete(`/posts/${post._id}`);
    toast.success('Post deleted');
    navigate('/dashboard');
  };

  const deleteComment = async (commentId) => {
    await api.delete(`/comments/${commentId}`);
    setComments((current) => current.filter((item) => item._id !== commentId && item.parentComment !== commentId));
  };

  const article = useMemo(() => {
    if (!post?.content) return { html: '', toc: [] };
    const parser = new DOMParser();
    const doc = parser.parseFromString(post.content, 'text/html');
    const headings = [...doc.querySelectorAll('h2, h3')].map((heading, index) => {
      const id = `section-${index}-${heading.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
      heading.id = id;
      return { id, text: heading.textContent, level: heading.tagName === 'H3' ? 3 : 2 };
    });
    return { html: doc.body.innerHTML, toc: headings };
  }, [post?.content]);

  const share = async (network) => {
    const url = window.location.href;
    if (network === 'copy') {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
      return;
    }
    const text = encodeURIComponent(post.title);
    const encodedUrl = encodeURIComponent(url);
    const target = network === 'twitter'
      ? `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`
      : `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    window.open(target, '_blank', 'noopener,noreferrer');
  };

  if (error && !post) return <section className="container-shell py-10"><ErrorState message={error} onRetry={loadPost} /></section>;
  if (!post) return <PageLoader />;

  return (
    <article>
      <div className="fixed left-0 top-0 z-50 h-1 bg-primary transition-all" style={{ width: `${progress}%` }} />
      <section className="border-b border-border-light bg-white py-10 dark:border-border-dark dark:bg-surface-dark">
        <div className="container-shell max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-primary">
            <span>{post.category}</span><span className="text-slate-300">/</span><span>{post.readingTime} min read</span><span className="text-slate-300">/</span><span>{formatDate(post.createdAt)}</span>
          </div>
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl">{post.title}</h1>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <Link to={`/profile/${post.author?._id}`} className="flex items-center gap-3">
              <Avatar user={post.author} />
              <div><p className="font-bold">{post.author?.name}</p><p className="text-sm text-slate-500">{post.author?.bio || 'Developer writer'}</p></div>
            </Link>
            {canManage && (
              <div className="flex gap-2">
                <Link to={`/edit/${post._id}`} className="btn-secondary"><Edit className="h-4 w-4" /> Edit</Link>
                <button type="button" onClick={() => setConfirmDelete(true)} className="btn-secondary text-red-600"><Trash2 className="h-4 w-4" /> Delete</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {post.coverImage && <div className="container-shell max-w-5xl py-8"><img src={post.coverImage} alt={post.title} className="aspect-[16/7] w-full rounded-lg object-cover" /></div>}

      <section className="container-shell grid max-w-6xl gap-8 py-8 lg:grid-cols-[220px_minmax(0,1fr)_220px]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 surface p-4">
            <p className="mb-3 text-sm font-black">In this article</p>
            {article.toc.length ? (
              <nav className="grid gap-2 text-sm">
                {article.toc.map((item) => <a key={item.id} href={`#${item.id}`} className={`text-muted-light transition hover:text-primary dark:text-muted-dark ${item.level === 3 ? 'pl-3' : ''}`}>{item.text}</a>)}
              </nav>
            ) : <p className="text-sm text-muted-light dark:text-muted-dark">Quick read</p>}
          </div>
        </aside>
        <div className="surface p-6">
          <div className="prose-content max-w-none text-slate-700 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: article.html }} />
          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags?.map((tag) => <Link key={tag} to={`/search?tag=${tag}`} className="rounded-md bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">#{tag}</Link>)}
          </div>
          <div className="mt-8 surface p-4">
            <p className="eyebrow">About the author</p>
            <Link to={`/profile/${post.author?._id}`} className="mt-3 flex items-center gap-3">
              <Avatar user={post.author} />
              <div>
                <p className="font-black">{post.author?.name}</p>
                <p className="text-sm text-muted-light dark:text-muted-dark">{post.author?.bio || 'Developer writer'}</p>
              </div>
            </Link>
          </div>
        </div>
        <aside className="space-y-3">
          <motion.button type="button" onClick={toggleLike} whileTap={{ scale: 0.92 }} className={`btn-secondary w-full ${liked ? 'border-red-200 text-red-600' : ''}`}><Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} /> {compactNumber(post.likes)} Likes</motion.button>
          <motion.button type="button" onClick={toggleBookmark} whileTap={{ scale: 0.92 }} className={`btn-secondary w-full ${bookmarked ? 'border-primary text-primary' : ''}`}><Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} /> {bookmarked ? 'Saved' : 'Save'}</motion.button>
          <div className="surface p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-black"><Share2 className="h-4 w-4" /> Share</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => share('copy')} className="btn-secondary px-3" aria-label="Copy article link"><LinkIcon className="h-4 w-4" /></button>
              <button type="button" onClick={() => share('twitter')} className="btn-secondary px-3" aria-label="Share on Twitter"><Twitter className="h-4 w-4" /></button>
              <button type="button" onClick={() => share('linkedin')} className="btn-secondary px-3" aria-label="Share on LinkedIn"><Linkedin className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="surface flex items-center gap-2 p-4 text-sm text-slate-500"><Eye className="h-4 w-4" /> {compactNumber(post.views)} Views</div>
          <div className="surface flex items-center gap-2 p-4 text-sm text-slate-500"><MessageCircle className="h-4 w-4" /> {comments.length} Comments</div>
        </aside>
      </section>

      {related.length > 0 && (
        <section className="container-shell max-w-6xl pb-10">
          <div className="mb-4">
            <p className="eyebrow">Related</p>
            <h2 className="section-title mt-1">More in {post.category}</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {related.map((item) => (
              <Link key={item._id} to={`/blogs/${item.slug}`} className="surface p-4 transition hover:-translate-y-1 hover:border-primary">
                <p className="text-xs font-bold uppercase text-primary">{item.category}</p>
                <h3 className="mt-2 font-black leading-snug">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-light dark:text-muted-dark">{item.readingTime} min read</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="container-shell max-w-4xl pb-12">
        <h2 className="mb-4 text-2xl font-black">Discussion</h2>
        <motion.form onSubmit={submitComment} className="surface mb-5 flex gap-3 p-4" whileFocus={{ scale: 1.01 }}>
          <div className="grid flex-1 gap-2">
            {replyTo && <div className="flex items-center justify-between rounded-md bg-sky-50 px-3 py-2 text-xs font-semibold text-primary dark:bg-slate-800">Replying to {replyTo.userId?.name}<button type="button" onClick={() => setReplyTo(null)}>Cancel</button></div>}
            <label className="sr-only" htmlFor="comment-input">{replyTo ? 'Write a reply' : 'Add to the discussion'}</label>
            <input id="comment-input" value={comment} onChange={(event) => setComment(event.target.value)} className="input" placeholder={replyTo ? 'Write a reply' : 'Add to the discussion'} />
          </div>
          <button className="btn-primary px-3" type="submit" aria-label={replyTo ? 'Submit reply' : 'Submit comment'}><Send className="h-4 w-4" /></button>
        </motion.form>
        {comments.length === 0 ? <EmptyState title="No comments yet" body="Start the conversation with a thoughtful response." /> : (
          <div className="grid gap-3">
            {comments.filter((item) => !item.parentComment).map((item) => {
              const replies = comments.filter((reply) => String(reply.parentComment) === String(item._id));
              return (
                <div key={item._id} className="surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3"><Avatar user={item.userId} size="h-8 w-8" /><div><p className="text-sm font-bold">{item.userId?.name}</p><p className="text-xs text-slate-400">{formatDate(item.createdAt)}</p></div></div>
                    {(user?._id === item.userId?._id || user?.role === 'admin') && <button type="button" onClick={() => deleteComment(item._id)} className="text-red-500"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">{item.comment}</p>
                  <button type="button" onClick={() => setReplyTo(item)} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary"><Reply className="h-3 w-3" /> Reply</button>
                  {replies.length > 0 && (
                    <div className="mt-4 grid gap-3 border-l-2 border-sky-100 pl-4 dark:border-slate-700">
                      {replies.map((reply) => (
                        <div key={reply._id} className="rounded-md bg-slate-50 p-3 dark:bg-slate-900">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2"><Avatar user={reply.userId} size="h-7 w-7" /><span className="text-xs font-bold">{reply.userId?.name}</span></div>
                            {(user?._id === reply.userId?._id || user?.role === 'admin') && <button type="button" onClick={() => deleteComment(reply._id)} className="text-red-500"><Trash2 className="h-4 w-4" /></button>}
                          </div>
                          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{reply.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
      <ConfirmModal
        open={confirmDelete}
        title="Delete this article?"
        body="This action permanently removes the article, comments, likes, and bookmarks."
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={deletePost}
      />
    </article>
  );
}
