import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { LogIn } from 'lucide-react';

export function Home() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [registrationAllowed, setRegistrationAllowed] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (user) return;
    api.get('/auth/registration-allowed')
      .then(({ data }) => setRegistrationAllowed(data.allowed))
      .catch(() => setRegistrationAllowed(false));
  }, [user]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
      <section className="glass p-8 rounded-3xl border-l-4 border-sky-500/50 text-center">
        <div className="h-1 w-16 accent-gradient rounded-full mx-auto mb-6" aria-hidden />
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6">
          Real-time <span className="text-transparent bg-clip-text accent-gradient">Intelligence.</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          A high-performance interface for managing distributed systems and automated environments.
        </p>
      </section>

      {user ? (
        <section className="glass p-8 rounded-3xl border-l-4 border-emerald-500/60 text-center max-w-md mx-auto">
          <p className="text-slate-400 mb-4">
            Welcome back, <span className="text-sky-400 font-medium">{user.email}</span>.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full accent-gradient text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Go to Dashboard
          </Link>
        </section>
      ) : (
        <section className="glass p-8 rounded-3xl border-l-4 border-sky-500/50 w-full max-w-md mx-auto">
          <div className="h-1 w-16 bg-sky-500 rounded-full mb-6" aria-hidden />
          <h2 className="text-2xl font-bold mb-2 text-slate-100">Sign in</h2>
          <p className="text-slate-400 text-sm mb-6">
            Use your account credentials to access the dashboard. New accounts are created by an
            administrator.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2" role="alert">
                {error}
              </p>
            )}
            <div>
              <label htmlFor="home-login-username" className="block text-sm font-medium text-slate-400 mb-1">
                Username
              </label>
              <input
                id="home-login-username"
                type="text"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50"
                placeholder="Your username"
              />
            </div>
            <div>
              <label htmlFor="home-login-password" className="block text-sm font-medium text-slate-400 mb-1">
                Password
              </label>
              <input
                id="home-login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-full accent-gradient text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" aria-hidden />
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="mt-6 text-sm text-slate-400 text-center">
            {registrationAllowed ? (
              <>
                First time?{' '}
                <Link to="/register" className="text-amber-400 hover:text-amber-300 transition-colors">
                  Create the administrator account
                </Link>
                . Otherwise contact your administrator for an account.
              </>
            ) : (
              "Don't have an account? Contact your administrator for an account."
            )}
          </p>
        </section>
      )}
    </div>
  );
}
