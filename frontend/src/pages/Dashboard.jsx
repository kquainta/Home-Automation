import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import {
  Activity,
  Zap,
  ShieldCheck,
  FileText,
  RefreshCw,
  Database,
  BarChart3,
  CheckCircle2,
  Wifi,
  Cpu,
  Bell,
  Users,
  Plus,
  Trash2,
} from 'lucide-react';

const RECENT_ACTIVITY = [
  { id: 1, title: 'Node sync completed', time: '2 min ago', status: 'success', icon: CheckCircle2 },
  { id: 2, title: 'Backup finished', time: '15 min ago', status: 'success', icon: Database },
  { id: 3, title: 'Alert resolved', time: '1 hr ago', status: 'success', icon: ShieldCheck },
  { id: 4, title: 'Network scan', time: '2 hrs ago', status: 'success', icon: Wifi },
  { id: 5, title: 'Health check', time: '3 hrs ago', status: 'success', icon: Cpu },
];

const QUICK_ACTIONS = [
  { label: 'View logs', icon: FileText, href: '#' },
  { label: 'Restart node', icon: RefreshCw, href: '#' },
  { label: 'Run backup', icon: Database, href: '#' },
  { label: 'Analytics', icon: BarChart3, href: '#' },
];

export function Dashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userError, setUserError] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [creating, setCreating] = useState(false);

  const isAdmin = Boolean(user?.is_admin);

  const fetchUsers = async () => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    setUserError('');
    try {
      const { data } = await api.get('/auth/users');
      setUsers(data);
    } catch (err) {
      setUserError(err.response?.data?.detail || 'Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setCreating(true);
    setUserError('');
    try {
      await api.post('/auth/users', {
        email: newEmail,
        password: newPassword,
        is_admin: newIsAdmin,
      });
      setNewEmail('');
      setNewPassword('');
      setNewIsAdmin(false);
      await fetchUsers();
    } catch (err) {
      setUserError(err.response?.data?.detail || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (email) => {
    if (!isAdmin) return;
    if (!window.confirm(`Delete user "${email}"? This cannot be undone.`)) return;
    setUserError('');
    try {
      await api.delete(`/auth/users/${encodeURIComponent(email)}`);
      setUsers((prev) => prev.filter((u) => u.email !== email));
    } catch (err) {
      setUserError(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
      <section className="glass p-6 rounded-3xl border-l-4 border-emerald-500/60 flex flex-wrap items-center justify-between gap-4">
        <p className="text-slate-400">
          Welcome, <span className="text-sky-400 font-medium">{user?.email}</span>.
        </p>
        {isAdmin && (
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
            Admin controls enabled
          </span>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div className="glass p-8 rounded-3xl border-l-4 border-emerald-500/60">
          <div className="h-2 w-12 bg-emerald-500 rounded-full mb-6" aria-hidden />
          <h3 className="text-xl font-bold mb-2 text-slate-100">System Health</h3>
          <p className="text-slate-400 text-sm">All nodes reporting 99.9% uptime across local clusters.</p>
          <div className="mt-6 text-2xl font-mono text-emerald-400">ONLINE</div>
        </div>
        <div className="glass p-8 rounded-3xl border-l-4 border-purple-500/60">
          <div className="h-2 w-12 bg-purple-500 rounded-full mb-6" aria-hidden />
          <h3 className="text-xl font-bold mb-2 text-slate-100">Network Load</h3>
          <p className="text-slate-400 text-sm">Multi-gigabit backbone traffic is currently optimized.</p>
          <div className="mt-6 text-2xl font-mono text-slate-100">1.2 Gbps</div>
        </div>
        <div className="glass p-8 rounded-3xl border-l-4 border-sky-500/50">
          <div className="h-2 w-12 bg-sky-400 rounded-full mb-6" aria-hidden />
          <h3 className="text-xl font-bold mb-2 text-slate-100">IoT Integration</h3>
          <p className="text-slate-400 text-sm">ESP32 sensors active. Data streaming to GCP via Pub/Sub.</p>
          <div className="mt-6 text-2xl font-mono text-sky-400">ACTIVE</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="glass p-8 rounded-3xl border-l-4 border-sky-500/40 lg:col-span-2">
          <h2 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" aria-hidden />
            Recent activity
          </h2>
          <ul className="space-y-3" role="list">
            {RECENT_ACTIVITY.map(({ id, title, time, status, icon: Icon }) => (
              <li key={id}>
                <div className="tile-card flex items-center gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-emerald-400" aria-hidden />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-100 truncate">{title}</p>
                    <p className="text-sm text-slate-400">{time}</p>
                  </div>
                  <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-emerald-400" aria-hidden />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="glass p-8 rounded-3xl border-l-4 border-amber-500/50">
          <h2 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4" aria-hidden />
            Quick actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map(({ label, icon: Icon, href }) => (
              <a key={label} href={href} className="tile-action group">
                <Icon className="w-6 h-6 text-sky-400 group-hover:text-sky-300 transition-colors" aria-hidden />
                <span className="text-sm font-medium text-slate-200 group-hover:text-slate-100 transition-colors">
                  {label}
                </span>
              </a>
            ))}
          </div>
        </section>
      </div>

      {isAdmin && (
        <section className="glass p-8 rounded-3xl border-l-4 border-sky-500/60">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Users className="w-4 h-4" aria-hidden />
              User management
            </h2>
            {loadingUsers && (
              <span className="text-xs text-slate-500 font-mono">Loading users…</span>
            )}
          </div>

          {userError && (
            <p className="mb-4 text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2" role="alert">
              {userError}
            </p>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label htmlFor="admin-new-email" className="block text-sm font-medium text-slate-400 mb-1">
                  User identifier
                </label>
                <input
                  id="admin-new-email"
                  type="text"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50"
                  placeholder="username or email"
                />
              </div>
              <div>
                <label
                  htmlFor="admin-new-password"
                  className="block text-sm font-medium text-slate-400 mb-1"
                >
                  Temporary password
                </label>
                <input
                  id="admin-new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50"
                  placeholder="Set an initial password"
                />
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-slate-400 select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/20 bg-transparent text-sky-500 focus:ring-sky-500/50"
                  checked={newIsAdmin}
                  onChange={(e) => setNewIsAdmin(e.target.checked)}
                />
                Grant admin access
              </label>
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full accent-gradient text-white font-semibold text-sm disabled:opacity-60"
              >
                <Plus className="w-4 h-4" aria-hidden />
                {creating ? 'Creating user…' : 'Create user'}
              </button>
            </form>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Existing users
              </h3>
              {users.length === 0 ? (
                <p className="text-sm text-slate-500">No user accounts found.</p>
              ) : (
                <ul className="space-y-2" role="list">
                  {users.map((u) => (
                    <li key={u.email}>
                      <div className="tile-card flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-100 truncate">{u.email}</p>
                          <p className="text-xs text-slate-500">
                            {u.is_admin ? 'Administrator' : 'Standard user'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.email)}
                          className="inline-flex items-center justify-center rounded-full border border-red-500/40 text-red-400 hover:bg-red-500/10 w-8 h-8 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="glass py-3 px-6 rounded-3xl border-l-4 border-emerald-500/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Bell className="w-4 h-4 text-emerald-400 flex-shrink-0" aria-hidden />
          <p className="text-sm text-slate-400">All systems nominal. No alerts.</p>
        </div>
        <div className="flex flex-col items-end text-right">
          {import.meta.env.VITE_BUILD_TIME && (
            <div className="text-xs font-mono text-slate-500" title="Deploy build time">
              Build: {import.meta.env.VITE_BUILD_TIME}
            </div>
          )}
          <div className="text-xs font-mono text-slate-500">Last checked: just now</div>
        </div>
      </section>
    </div>
  );
}
