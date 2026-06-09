import { Menu, Moon, PenSquare, Search, Sun, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import Avatar from './Avatar.jsx';

const linkClass = ({ isActive }) => `rounded-md px-2 py-1 text-sm font-semibold transition ${isActive ? 'bg-sky-50 text-primary dark:bg-slate-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'}`;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const submitSearch = (event) => {
    event.preventDefault();
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleLogout = () => {
    logout();
    setOpen(false);
    window.setTimeout(() => navigate('/', { replace: true }), 0);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border-light bg-white/85 backdrop-blur-xl transition-colors dark:border-border-dark dark:bg-[#0F172A]/88">
      <div className="container-shell flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-sm font-black text-slate-950 shadow-sm">DC</span>
          <span className="text-lg font-black tracking-tight">DevConnect</span>
        </Link>

        <form onSubmit={submitSearch} className="hidden min-w-0 flex-1 max-w-md items-center gap-2 rounded-md border border-border-light bg-white/80 px-3 py-2 shadow-sm transition focus-within:border-primary focus-within:ring-4 focus-within:ring-sky-100 dark:border-border-dark dark:bg-surface-dark md:flex">
          <Search className="h-4 w-4 text-slate-400" />
          <label className="sr-only" htmlFor="desktop-search">Search articles</label>
          <input id="desktop-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, tag, category, author" className="w-full bg-transparent text-sm outline-none" />
        </form>

        <nav className="hidden items-center gap-5 md:flex">
          <NavLink className={linkClass} to="/search">Explore</NavLink>
          {user && <NavLink className={linkClass} to="/dashboard">Dashboard</NavLink>}
          {user?.role === 'admin' && <NavLink className={linkClass} to="/admin">Admin</NavLink>}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <button type="button" onClick={toggleTheme} className="btn-secondary px-3" title="Toggle theme">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {user ? (
            <>
              <Link to="/create" className="btn-primary"><PenSquare className="h-4 w-4" /> Write</Link>
              <Link to="/profile"><Avatar user={user} /></Link>
              <button type="button" onClick={handleLogout} className="btn-secondary">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">Login</Link>
              <Link to="/register" className="btn-primary">Start Writing</Link>
            </>
          )}
        </div>

        <button type="button" onClick={() => setOpen((value) => !value)} className="btn-secondary px-3 md:hidden" aria-expanded={open} aria-label="Toggle navigation menu">
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="animate-menu-in border-t border-border-light bg-white px-4 py-4 shadow-lg dark:border-border-dark dark:bg-[#0F172A] md:hidden">
          <div className="flex flex-col gap-3 overflow-hidden">
            <form onSubmit={submitSearch} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 dark:border-slate-800">
              <Search className="h-4 w-4 text-slate-400" />
              <label className="sr-only" htmlFor="mobile-search">Search articles</label>
              <input id="mobile-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="w-full bg-transparent text-sm outline-none" />
            </form>
            <Link to="/search">Explore</Link>
            {user && <Link to="/dashboard">Dashboard</Link>}
            {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
            {user ? <button type="button" onClick={handleLogout} className="btn-secondary">Logout</button> : <Link to="/register" className="btn-primary">Start Writing</Link>}
          </div>
        </div>
      )}
    </header>
  );
}
