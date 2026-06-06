import { Save, Send } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import ReactQuill from 'react-quill';
import toast from 'react-hot-toast';

const initialState = {
  title: '',
  category: '',
  tags: '',
  coverImage: '',
  content: ''
};

const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function BlogForm({ initialValues, onSubmit, submitting }) {
  const [form, setForm] = useState(initialState);
  const [file, setFile] = useState(null);
  const slug = useMemo(() => slugify(form.title), [form.title]);

  useEffect(() => {
    if (initialValues) {
      setForm({
        title: initialValues.title || '',
        category: initialValues.category || '',
        tags: initialValues.tags?.join(', ') || '',
        coverImage: initialValues.coverImage || '',
        content: initialValues.content || ''
      });
    }
  }, [initialValues]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = (status) => async (event) => {
    event.preventDefault();
    if (!form.title || !form.category || form.content.replace(/<[^>]+>/g, '').trim().length < 20) {
      toast.error('Add a title, category, and at least 20 characters of content');
      return;
    }

    const data = new FormData();
    Object.entries({ ...form, slug, status }).forEach(([key, value]) => data.append(key, value));
    if (file) data.append('coverImage', file);
    await onSubmit(data);
  };

  return (
    <form className="grid gap-6" onSubmit={submit('draft')}>
      <div className="surface p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 md:col-span-2">
            <span className="label">Title</span>
            <input className="input text-lg font-bold" value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="A clear, searchable article title" />
          </label>
          <label className="grid gap-2">
            <span className="label">Slug</span>
            <input className="input" value={slug} readOnly />
          </label>
          <label className="grid gap-2">
            <span className="label">Category</span>
            <input className="input" value={form.category} onChange={(event) => update('category', event.target.value)} placeholder="React, Career, Backend" />
          </label>
          <label className="grid gap-2 md:col-span-2">
            <span className="label">Tags</span>
            <input className="input" value={form.tags} onChange={(event) => update('tags', event.target.value)} placeholder="javascript, frontend, architecture" />
          </label>
          <label className="grid gap-2 md:col-span-2">
            <span className="label">Cover Image</span>
            <input className="input" type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </label>
        </div>
      </div>

      <div className="surface overflow-hidden p-2">
        <ReactQuill theme="snow" value={form.content} onChange={(value) => update('content', value)} className="min-h-[360px]" />
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <button type="submit" disabled={submitting} className="btn-secondary"><Save className="h-4 w-4" /> Save Draft</button>
        <button type="button" disabled={submitting} onClick={submit('published')} className="btn-primary"><Send className="h-4 w-4" /> Publish</button>
      </div>
    </form>
  );
}
