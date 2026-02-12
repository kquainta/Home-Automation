import React, { useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { LogOut } from 'lucide-react';

export function Layout() {
  const { user, logout } = useAuth();
  const [registrationAllowed, setRegistrationAllowed] = useState(false);
  const [registrationChecked, setRegistrationChecked] = useState(false);

  useEffect(() => {
    if (user) return;
    api.get('/auth/registration-allowed')
      .then(({ data }) => setRegistrationAllowed(data.allowed))
      .catch(() => setRegistrationAllowed(false))
      .finally(() => setRegistrationChecked(true));
  }, [user]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] font-sans antialiased">
      <nav className="flex flex-wrap justify-between items-center gap-4 max-w-7xl mx-auto px-6 py-4">
        <Link to="/" className="text-2xl font-bold tracking-tighter">
          Q-<span className="text-sky-400">CENTRAL</span>
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="text-sm font-medium text-slate-400 hover:text-sky-400 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/homeassistant"
                className="text-sm font-medium text-slate-400 hover:text-sky-400 transition-colors"
              >
                Home Assistant
              </Link>
              {user.is_admin && (
                <Link
                  to="/users"
                  className="text-sm font-medium text-slate-400 hover:text-sky-400 transition-colors"
                >
                  Users
                </Link>
              )}
              <div className="flex items-center gap-2 pl-4 border-l border-white/10">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-sm font-medium text-emerald-300">
                    {user.email}
                  </span>
                  <button
                    type="button"
                    onClick={logout}
                    className="ml-1 p-1 rounded hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 transition-colors"
                    title="Logout"
                    aria-label="Logout"
                  >
                    <LogOut className="w-4 h-4" aria-hidden />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-slate-400 hover:text-sky-400 transition-colors"
              >
                Login
              </Link>
              {registrationChecked && registrationAllowed && (
                <Link
                  to="/register"
                  className="text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Create first administrator
                </Link>
              )}
              <Link
                to="/dashboard"
                className="px-5 py-2 rounded-full accent-gradient text-white font-semibold text-sm"
              >
                Dashboard
              </Link>
            </>
          )}
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
