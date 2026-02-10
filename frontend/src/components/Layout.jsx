import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] font-sans antialiased">
      <nav className="flex flex-wrap justify-between items-center gap-4 max-w-7xl mx-auto px-6 py-4">
        <Link to="/" className="text-2xl font-bold tracking-tighter">
          TECH<span className="text-sky-400">CORE</span>
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-slate-400 hidden sm:inline">{user.email}</span>
              <Link
                to="/dashboard"
                className="text-sm font-medium text-slate-400 hover:text-sky-400 transition-colors"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={logout}
                className="px-4 py-2 rounded-full border border-white/10 text-slate-300 hover:bg-white/5 text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" aria-hidden />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-slate-400 hover:text-sky-400 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium text-slate-400 hover:text-sky-400 transition-colors"
              >
                Register
              </Link>
              <Link
                to="/dashboard"
                className="px-5 py-2 rounded-full accent-gradient text-white font-semibold text-sm"
              >
                Launch Console
              </Link>
            </>
          )}
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
