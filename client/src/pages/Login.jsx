import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import useSeo from '../hooks/useSeo.js';

export default function Login() {
  useSeo({
    title: 'Login | DevConnect',
    description: 'Log in to DevConnect to write, comment, like, bookmark, and manage your developer blog.'
  });

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [googleStatus, setGoogleStatus] = useState(import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'loading' : 'unconfigured');
  const googleInitialized = useRef(false);
  const { login, googleLogin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) navigate(location.state?.from?.pathname || '/dashboard');
  }, [user, navigate, location.state]);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const renderGoogleButton = () => {
      if (!window.google || googleInitialized.current) return;
      googleInitialized.current = true;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: ({ credential }) => googleLogin(credential).catch((error) => toast.error(error.message))
      });
      window.google.accounts.id.renderButton(document.getElementById('google-login'), { theme: 'outline', size: 'large', width: 320 });
      setGoogleStatus('ready');
    };

    if (window.google) {
      renderGoogleButton();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    script.onerror = () => setGoogleStatus('failed');
    document.head.appendChild(script);
  }, [googleLogin]);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await login(form);
      navigate(location.state?.from?.pathname || '/dashboard');
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container-shell grid min-h-[72vh] place-items-center py-12">
      <form onSubmit={submit} className="surface w-full max-w-md p-6">
        <h1 className="text-3xl font-black">Login</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Continue publishing and managing your developer presence.</p>
        <div className="mt-6 grid gap-4">
          <label className="grid gap-2"><span className="label">Email</span><input className="input" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label className="grid gap-2"><span className="label">Password</span><input className="input" type="password" autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
          <button disabled={loading} className="btn-primary">Login</button>
          <div id="google-login" className="min-h-10" />
          {googleStatus === 'unconfigured' && <p className="rounded-md bg-slate-100 px-3 py-2 text-center text-xs font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-400">Google sign-in is not configured for this environment.</p>}
          {googleStatus === 'failed' && <p className="rounded-md bg-rose-50 px-3 py-2 text-center text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">Google sign-in could not load. Use email login or try again later.</p>}
          <p className="text-center text-sm text-slate-500">New here? <Link to="/register" className="font-semibold text-primary">Create an account</Link></p>
        </div>
      </form>
    </section>
  );
}
