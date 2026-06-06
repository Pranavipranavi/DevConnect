import { WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (online) return null;

  return (
    <div className="bg-rose-500 px-4 py-2 text-center text-sm font-semibold text-white">
      <span className="inline-flex items-center gap-2"><WifiOff className="h-4 w-4" /> You are offline. Some actions will retry when your connection returns.</span>
    </div>
  );
}
