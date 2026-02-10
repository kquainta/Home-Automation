import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound } from 'lucide-react';

export function ChangePassword() {
  const { user, loading, changePassword } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: { pathname: '/change-password' } }} replace />;
  }
  if (!user.must_change_password) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex items-center justify-center px-4 py-12">
      <section className="glass p-8 rounded-3xl border-l-4 border-amber-500/50 w-full max-w-md">
        <div className="h-1 w-16 bg-amber-500 rounded-full mb-6" aria-hidden />
        <h1 className="text-2xl font-bold mb-2 text-slate-100">Change your password</h1>
        <p className="text-slate-400 text-sm mb-6">
          You must change your password before continuing. Choose a new password that is at least 6 characters.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2" role="alert">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="change-current" className="block text-sm font-medium text-slate-400 mb-1">
              Current password
            </label>
            <input
              id="change-current"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label htmlFor="change-new" className="block text-sm font-medium text-slate-400 mb-1">
              New password
            </label>
            <input
              id="change-new"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50"
              placeholder="At least 6 characters"
            />
          </div>
          <div>
            <label htmlFor="change-confirm" className="block text-sm font-medium text-slate-400 mb-1">
              Confirm new password
            </label>
            <input
              id="change-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-full accent-gradient text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <KeyRound className="w-4 h-4" aria-hidden />
            {submitting ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </section>
    </div>
  );
}
