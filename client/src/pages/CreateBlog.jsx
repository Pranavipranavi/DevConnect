import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import BlogForm from '../components/BlogForm.jsx';
import api from '../services/api.js';
import useSeo from '../hooks/useSeo.js';

export default function CreateBlog() {
  useSeo({
    title: 'Create Blog | DevConnect',
    description: 'Write and publish a new developer article on DevConnect.'
  });

  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const submit = async (formData) => {
    setSubmitting(true);
    try {
      const { data } = await api.post('/posts', formData);
      toast.success(data.post.status === 'published' ? 'Post published' : 'Draft saved');
      navigate(`/blogs/${data.post.slug}`);
    } catch (error) {
      toast.error(error.message || 'Could not save post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="container-shell py-10">
      <div className="mb-6">
        <p className="text-sm font-bold uppercase text-primary">Editor</p>
        <h1 className="mt-2 text-3xl font-black">Create Blog</h1>
      </div>
      <BlogForm onSubmit={submit} submitting={submitting} />
    </section>
  );
}
