import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard } from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="flex items-center justify-center px-4 py-12">
      <section className="glass p-8 rounded-3xl border-l-4 border-emerald-500/60 w-full max-w-lg text-center">
        <div className="h-1 w-16 bg-emerald-500 rounded-full mx-auto mb-6" aria-hidden />
        <LayoutDashboard className="w-12 h-12 text-emerald-400 mx-auto mb-4" aria-hidden />
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Dashboard</h1>
        <p className="text-slate-400">
          Welcome, <span className="text-sky-400 font-medium">{user?.email}</span>. You’re signed in.
        </p>
      </section>
    </div>
  );
}
