import React from 'react';
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

export function Home() {
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
                <span className="text-sm font-medium text-slate-200 group-hover:text-slate-100 transition-colors">{label}</span>
              </a>
            ))}
          </div>
        </section>
      </div>

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
