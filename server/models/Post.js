import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 140 },
  slug: { type: String, required: true, unique: true, index: true },
  content: { type: String, required: true },
  coverImage: { type: String, default: '' },
  category: { type: String, required: true, trim: true },
  tags: [{ type: String, trim: true, lowercase: true }],
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  readingTime: { type: Number, default: 1 },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' }
}, { timestamps: true });

postSchema.index({ title: 'text', category: 'text', tags: 'text' });

export default mongoose.model('Post', postSchema);
