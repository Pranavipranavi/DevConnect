import { RefreshCw, TriangleAlert } from 'lucide-react';

export default function ErrorState({ title = 'Request failed', message, onRetry }) {
  return (
    <div className="surface grid place-items-center px-6 py-12 text-center">
      <TriangleAlert className="mb-4 h-10 w-10 text-rose-500" />
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-light dark:text-muted-dark">{message}</p>
      {onRetry && <button type="button" onClick={onRetry} className="btn-secondary mt-5"><RefreshCw className="h-4 w-4" /> Retry</button>}
    </div>
  );
}
