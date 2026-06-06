import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import useSeo from '../hooks/useSeo.js';

export default function Register() {
  useSeo({
    title: 'Create Account | DevConnect',
    description: 'Create a DevConnect account and start publishing developer articles.'
  });

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container-shell grid min-h-[72vh] place-items-center py-12">
      <form onSubmit={submit} className="surface w-full max-w-md p-6">
        <h1 className="text-3xl font-black">Start Writing</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Create your DevConnect profile and publish your first article.</p>
        <div className="mt-6 grid gap-4">
          <label className="grid gap-2"><span className="label">Name</span><input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label className="grid gap-2"><span className="label">Email</span><input className="input" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label className="grid gap-2"><span className="label">Password</span><input className="input" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
          <button disabled={loading} className="btn-primary">Create Account</button>
          <p className="text-center text-sm text-slate-500">Already registered? <Link to="/login" className="font-semibold text-primary">Login</Link></p>
        </div>
      </form>
    </section>
  );
}
