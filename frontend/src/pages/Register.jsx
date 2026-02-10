import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { UserPlus, RotateCcw } from 'lucide-react';

function RegisterDisabled() {
  // Link goes straight to the backend so it works with Docker frontend (no proxy).
  // When VITE_API_URL is set (e.g. by run-frontend.ps1), use that; otherwise same-origin + proxy.
  const apiBase = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '')
    : (typeof window !== 'undefined' && window.location.origin)
      ? window.location.origin
      : '';
  const resetHref = apiBase
    ? `${apiBase}/api/v1/auth/dev/clear-users`
    : '/api/v1/auth/dev/clear-users';

  return (
    <div className="flex items-center justify-center px-4 py-12">
      <section className="glass p-8 rounded-3xl border-l-4 border-amber-500/50 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-2 text-slate-100">Registration disabled</h1>
        <p className="text-slate-400 text-sm mb-6">
          Self-service registration is not available. An administrator must create your account.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={resetHref}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-amber-500/50 text-amber-400 hover:bg-amber-500/10 text-sm font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" aria-hidden />
            Reset for testing (clear all users)
          </a>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full accent-gradient text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Sign in
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Reset clears all users. You’ll see a confirmation page; then open the Register page again to create the first admin.
        </p>
      </section>
    </div>
  );
}

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [allowed, setAllowed] = useState(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/auth/registration-allowed')
      .then(({ data }) => setAllowed(data.allowed))
      .catch(() => setAllowed(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (allowed === null) {
    return (
      <div className="flex items-center justify-center px-4 py-12">
        <p className="text-slate-400">Checking…</p>
      </div>
    );
  }

  if (!allowed) {
    return (
      <RegisterDisabled />
    );
  }

  return (
    <div className="flex items-center justify-center px-4 py-12">
      <section className="glass p-8 rounded-3xl border-l-4 border-amber-500/50 w-full max-w-md">
        <div className="h-1 w-16 bg-amber-500 rounded-full mb-6" aria-hidden />
        <h1 className="text-2xl font-bold mb-2 text-slate-100">Create first administrator</h1>
        <p className="text-slate-400 text-sm mb-6">
          Set up the initial admin account. This is the only self-service registration; after this, only admins can add users.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2" role="alert">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="register-email" className="block text-sm font-medium text-slate-400 mb-1">
              User identifier
            </label>
            <input
              id="register-email"
              type="text"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50"
              placeholder="admin or you@example.com"
            />
          </div>
          <div>
            <label htmlFor="register-password" className="block text-sm font-medium text-slate-400 mb-1">
              Password
            </label>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50"
              placeholder="At least 6 characters"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-full accent-gradient text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" aria-hidden />
            {submitting ? 'Creating admin account…' : 'Create administrator'}
          </button>
        </form>
        <p className="mt-6 text-sm text-slate-400 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-sky-400 hover:text-sky-300 transition-colors">
            Sign in
          </Link>
        </p>
      </section>
    </div>
  );
}
