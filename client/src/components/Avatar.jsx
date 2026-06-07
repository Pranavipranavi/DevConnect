import { initials } from '../utils/format.js';
import { isRenderableImageUrl } from '../utils/image.js';

export default function Avatar({ user, size = 'h-10 w-10' }) {
  if (isRenderableImageUrl(user?.avatar)) {
    return <img src={user.avatar} alt={user.name} className={`${size} rounded-full object-cover`} />;
  }

  return (
    <div className={`${size} grid place-items-center rounded-full bg-slate-900 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-900`}>
      {initials(user?.name)}
    </div>
  );
}
