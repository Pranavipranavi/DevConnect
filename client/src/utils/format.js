export const formatDate = (date) => new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
}).format(new Date(date));

export const compactNumber = (value = 0) => Intl.NumberFormat('en', { notation: 'compact' }).format(value);

export const stripHtml = (html = '') => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export const initials = (name = 'D') => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
