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
  Home,
  Loader2,
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

export function LegacyDashboard() {
  const { user } = useAuth();

  // Home Assistant
  const [haEntities, setHaEntities] = useState([]);
  const [haLoading, setHaLoading] = useState(false);
  const [haError, setHaError] = useState('');
  const [haDomain, setHaDomain] = useState('');
  const [haConfigured, setHaConfigured] = useState(null);


  const fetchHaStatus = async () => {
    try {
      const { data } = await api.get('/homeassistant/status');
      setHaConfigured(Boolean(data?.configured));
    } catch {
      setHaConfigured(false);
    }
  };

  const fetchHaEntities = async () => {
    setHaLoading(true);
    setHaError('');
    try {
      await fetchHaStatus();
      const params = haDomain ? { domain: haDomain } : {};
      const { data } = await api.get('/homeassistant/entities', { params });
      setHaEntities(Array.isArray(data) ? data : []);
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Failed to load Home Assistant entities';
      setHaError(detail);
      setHaEntities([]);
    } finally {
      setHaLoading(false);
    }
  };

  useEffect(() => {
    fetchHaEntities();
    const interval = setInterval(fetchHaEntities, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [haDomain]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
      <section className="glass p-6 rounded-3xl border-l-4 border-emerald-500/60 flex flex-wrap items-center justify-between gap-4">
        <p className="text-slate-400">
          Welcome, <span className="text-sky-400 font-medium">{user?.email}</span>.
        </p>
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

      <section className="glass p-8 rounded-3xl border-l-4 border-orange-500/50">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <Home className="w-4 h-4" aria-hidden />
            Home Assistant
          </h2>
          <div className="flex items-center gap-3">
            <select
              value={haDomain}
              onChange={(e) => setHaDomain(e.target.value)}
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              aria-label="Filter by domain"
            >
              <option value="">All domains</option>
              <option value="light">Light</option>
              <option value="sensor">Sensor</option>
              <option value="switch">Switch</option>
              <option value="binary_sensor">Binary sensor</option>
              <option value="climate">Climate</option>
              <option value="cover">Cover</option>
              <option value="automation">Automation</option>
            </select>
            <button
              type="button"
              onClick={() => fetchHaEntities()}
              disabled={haLoading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 disabled:opacity-50 text-sm font-medium transition-colors"
              aria-label="Refresh entities"
            >
              {haLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="w-4 h-4" aria-hidden />
              )}
              Refresh
            </button>
          </div>
        </div>

        {haError && (
          <p className="mb-4 text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2" role="alert">
            {haError}
          </p>
        )}

        {haLoading && haEntities.length === 0 ? (
          <p className="text-slate-500 text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            Loading entities…
          </p>
        ) : haEntities.length === 0 ? (
          <p className="text-slate-500 text-sm">
            {haConfigured === false
              ? 'Home Assistant is not configured. Set HOME_ASSISTANT_URL and HOME_ASSISTANT_TOKEN in the project root .env (same folder as docker-compose.yml), then restart the backend (e.g. docker-compose down && docker-compose up --build).'
              : 'No entities to show for this domain. Try "All domains" or another filter.'}
          </p>
        ) : (
          <ul className="space-y-2" role="list">
            {haEntities.map((entity) => {
              const name = entity?.attributes?.friendly_name || entity?.entity_id || '—';
              const state = entity?.state ?? '—';
              const unit = entity?.attributes?.unit_of_measurement;
              const stateDisplay = unit ? `${state} ${unit}` : state;
              return (
                <li key={entity.entity_id}>
                  <div className="tile-card flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-100 truncate">{name}</p>
                      <p className="text-xs text-slate-500 font-mono truncate">{entity.entity_id}</p>
                    </div>
                    <span className="flex-shrink-0 text-sm font-medium text-orange-300 tabular-nums">
                      {stateDisplay}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>


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
