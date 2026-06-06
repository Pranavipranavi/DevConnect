import slugify from 'slugify';
import Post from '../models/Post.js';

export const createSlug = async (title, existingId = null) => {
  const base = slugify(title, { lower: true, strict: true, trim: true }) || 'post';
  let slug = base;
  let count = 1;

  while (await Post.findOne({ slug, ...(existingId ? { _id: { $ne: existingId } } : {}) })) {
    slug = `${base}-${count++}`;
  }

  return slug;
};
