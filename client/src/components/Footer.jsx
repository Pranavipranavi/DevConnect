import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-10 dark:border-slate-800 dark:bg-slate-950">
      <div className="container-shell flex flex-col justify-between gap-4 text-sm text-slate-500 sm:flex-row">
        <p>DevConnect - Share Knowledge. Build Reputation. Grow Together.</p>
        <div className="flex gap-4">
          <Link to="/search" className="hover:text-primary">Explore</Link>
          <Link to="/create" className="hover:text-primary">Write</Link>
          <Link to="/dashboard" className="hover:text-primary">Dashboard</Link>
        </div>
      </div>
    </footer>
  );
}
