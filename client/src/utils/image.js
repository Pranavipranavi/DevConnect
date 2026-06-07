export const isRenderableImageUrl = (url) => {
  if (!url) return false;
  const value = String(url);
  if (value.startsWith('data:image/') || value.startsWith('blob:') || value.startsWith('/uploads/')) return true;

  try {
    const parsed = new URL(value);
    return ['localhost', '127.0.0.1'].includes(parsed.hostname)
      || parsed.hostname === 'res.cloudinary.com';
  } catch {
    return false;
  }
};
