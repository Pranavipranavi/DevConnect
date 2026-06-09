import mongoose from 'mongoose';

const dropStaleUserIndexes = async () => {
  const collections = await mongoose.connection.db.listCollections({ name: 'users' }).toArray();
  if (!collections.length) return;

  const users = mongoose.connection.db.collection('users');
  const indexes = await users.indexes();
  const staleIndexes = indexes.filter((index) => (
    index.name === 'username_1'
    || (index.name === 'googleId_1' && index.unique && !index.sparse)
  ));

  await Promise.all(staleIndexes.map((index) => users.dropIndex(index.name)));
};

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(process.env.MONGO_URI);
    await dropStaleUserIndexes();
    console.log('MongoDB connected');
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
