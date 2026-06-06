import { Eye, Heart, MessageCircle } from 'lucide-react';
import { memo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Avatar from './Avatar.jsx';
import { compactNumber, formatDate, stripHtml } from '../utils/format.js';

function BlogCard({ post }) {
  return (
    <motion.article className="surface overflow-hidden transition" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} whileHover={{ y: -6, scale: 1.01, boxShadow: '0 24px 70px rgba(56, 189, 248, 0.16)' }} transition={{ duration: 0.22 }}>
      <Link to={`/blogs/${post.slug || post._id}`} className="block">
        <div className="aspect-[16/9] bg-slate-100 dark:bg-slate-900">
          {post.coverImage ? (
            <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center bg-gradient-to-br from-blue-100 via-slate-100 to-violet-100 text-sm font-bold text-slate-500 dark:from-slate-900 dark:via-blue-950 dark:to-violet-950">DevConnect</div>
          )}
        </div>
      </Link>
      <div className="p-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary">
          <span>{post.category}</span>
          <span className="text-slate-300">/</span>
          <span>{post.readingTime || 1} min read</span>
        </div>
        <Link to={`/blogs/${post.slug || post._id}`} className="mt-3 block text-xl font-black leading-tight hover:text-primary">{post.title}</Link>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{stripHtml(post.content)}</p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <Link to={`/profile/${post.author?._id}`} className="flex min-w-0 items-center gap-2">
            <Avatar user={post.author} size="h-8 w-8" />
            <span className="truncate text-sm font-semibold">{post.author?.name}</span>
          </Link>
          <span className="text-xs text-slate-400">{formatDate(post.createdAt)}</span>
        </div>
        <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800">
          <span className="inline-flex items-center gap-1"><Heart className="h-4 w-4" />{compactNumber(post.likes)}</span>
          <span className="inline-flex items-center gap-1"><Eye className="h-4 w-4" />{compactNumber(post.views)}</span>
          <span className="inline-flex items-center gap-1"><MessageCircle className="h-4 w-4" />Read</span>
        </div>
      </div>
    </motion.article>
  );
}

export default memo(BlogCard);
