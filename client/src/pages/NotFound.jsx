import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="container-shell grid min-h-[70vh] place-items-center py-12 text-center">
      <div>
        <p className="text-sm font-bold uppercase text-primary">404</p>
        <h1 className="mt-2 text-4xl font-black">Page not found</h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400">The page you are looking for does not exist.</p>
        <Link to="/" className="btn-primary mt-6">Back Home</Link>
      </div>
    </section>
  );
}
