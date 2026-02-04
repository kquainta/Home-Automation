import React, { useState } from 'react';
import { 
  Home, 
  Settings, 
  Activity, 
  Thermometer, 
  Droplets, 
  Lightbulb, 
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';

const GlassCard = ({ children, title, icon: Icon, value, status, color = "blue" }) => (
  <div className="relative group overflow-hidden">
    <div className="glass-card group-hover:scale-[1.02]"></div>
    <div className="relative p-6 flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl bg-${color}-500/20 text-${color}-400`}>
          <Icon size={24} />
        </div>
        {status && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${status === 'On' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {status}
          </span>
        )}
      </div>
      <h3 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-1">{title}</h3>
      <div className="text-3xl font-bold text-white mb-4">{value}</div>
      <div className="mt-auto">
        <button className="w-full py-2 glass-button text-white text-sm font-medium">
          Manage
        </button>
      </div>
    </div>
  </div>
);

function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#0f172a] bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white font-sans selection:bg-blue-500/30">
      {/* Background blobs for depth */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} glass-sidebar transition-all duration-500 flex flex-col`}>
          <div className="p-6 flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
              <Home className="text-white" size={24} />
            </div>
            {isSidebarOpen && <span className="font-bold text-xl tracking-tight">Q-Home</span>}
          </div>

          <nav className="flex-1 px-4 mt-8 space-y-2">
            {[
              { icon: Activity, label: 'Dashboard', active: true },
              { icon: ShieldCheck, label: 'Security', active: false },
              { icon: Thermometer, label: 'Climate', active: false },
              { icon: Lightbulb, label: 'Lighting', active: false },
              { icon: Settings, label: 'Settings', active: false },
            ].map((item, i) => (
              <button key={i} className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${item.active ? 'glass-nav-active' : 'glass-nav-inactive'}`}>
                <item.icon size={20} />
                {isSidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>

          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-4 border-t border-white/5 text-white/40 hover:text-white transition-colors"
          >
            {isSidebarOpen ? <X size={20} className="mx-auto" /> : <Menu size={20} className="mx-auto" />}
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8 lg:p-12">
          <header className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">Welcome back, Eugene</h1>
              <p className="text-white/40 mt-2 font-medium">Everything is running smoothly today.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 glass-pill text-sm font-medium text-white/60">
                Feb 4, 2026
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full border border-white/20 overflow-hidden shadow-lg">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Eugene" alt="Avatar" />
              </div>
            </div>
          </header>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <GlassCard title="Average Temp" icon={Thermometer} value="22.5°C" color="orange" />
            <GlassCard title="Humidity" icon={Droplets} value="48%" color="blue" />
            <GlassCard title="Power Usage" icon={Activity} value="1.2kW" color="green" />
            <GlassCard title="Active Lights" icon={Lightbulb} value="12" status="On" color="yellow" />
          </div>

          <h2 className="text-2xl font-bold mb-6 text-white/80">Room Management</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-8 glass-panel relative group">
              <div className="absolute top-0 right-0 p-4">
                <ShieldCheck className="text-green-400" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-6">Security Overview</h3>
              <div className="space-y-4">
                {['Front Door', 'Living Room Camera', 'Garage'].map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-4 glass-inner">
                    <span className="text-white/70 font-medium">{item}</span>
                    <span className="text-xs font-bold text-green-400 uppercase tracking-tighter">Secure</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 glass-panel">
              <h3 className="text-xl font-bold mb-6">Energy Consumption</h3>
              <div className="h-48 flex items-end gap-3 mt-4">
                {[40, 65, 30, 85, 50, 90, 60].map((h, i) => (
                  <div key={i} className="flex-1 bg-gradient-to-t from-blue-500/40 to-blue-400/10 rounded-t-lg transition-all duration-500 hover:from-blue-500/60" style={{ height: `${h}%` }}></div>
                ))}
              </div>
              <div className="flex justify-between mt-4 text-xs text-white/30 font-bold uppercase tracking-widest px-2">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
