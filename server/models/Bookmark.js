import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

bookmarkSchema.index({ postId: 1, userId: 1 }, { unique: true });

export default mongoose.model('Bookmark', bookmarkSchema);
