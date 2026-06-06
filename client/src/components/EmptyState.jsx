import { FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState({ title, body, action, to }) {
  return (
    <div className="surface grid place-items-center px-6 py-12 text-center">
      <FileText className="mb-4 h-10 w-10 text-primary" />
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">{body}</p>
      {action && to && <Link to={to} className="btn-primary mt-5">{action}</Link>}
    </div>
  );
}
