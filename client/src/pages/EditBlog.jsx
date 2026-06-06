import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import BlogForm from '../components/BlogForm.jsx';
import PageLoader from '../components/PageLoader.jsx';
import ErrorState from '../components/ErrorState.jsx';
import api from '../services/api.js';
import useSeo from '../hooks/useSeo.js';

export default function EditBlog() {
  useSeo({
    title: 'Edit Blog | DevConnect',
    description: 'Edit and refine your DevConnect article.'
  });

  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  const loadPost = () => {
    setError('');
    return api.get(`/posts/${id}`).then(({ data }) => setPost(data.post)).catch((err) => {
      setError(err.message || 'Post not found');
      toast.error(err.message || 'Post not found');
    });
  };

  useEffect(() => { loadPost(); }, [id]);

  const submit = async (formData) => {
    setSubmitting(true);
    try {
      const { data } = await api.put(`/posts/${post._id}`, formData);
      toast.success('Post updated');
      navigate(`/blogs/${data.post.slug}`);
    } catch (error) {
      toast.error(error.message || 'Could not update post');
    } finally {
      setSubmitting(false);
    }
  };

  if (error && !post) return <section className="container-shell py-10"><ErrorState message={error} onRetry={loadPost} /></section>;
  if (!post) return <PageLoader />;

  return (
    <section className="container-shell py-10">
      <div className="mb-6">
        <p className="text-sm font-bold uppercase text-primary">Editor</p>
        <h1 className="mt-2 text-3xl font-black">Edit Blog</h1>
      </div>
      <BlogForm initialValues={post} onSubmit={submit} submitting={submitting} />
    </section>
  );
}
