import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] font-sans antialiased">
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="text-2xl font-bold tracking-tighter">
          TECH<span className="text-sky-400">CORE</span>
        </div>
        <div className="space-x-8 hidden md:flex text-sm font-medium">
          <a href="#" className="text-sky-400 hover:text-sky-200 transition-colors">Network</a>
          <a href="#" className="text-sky-400 hover:text-sky-200 transition-colors">IoT Nodes</a>
          <a href="#" className="text-sky-400 hover:text-sky-200 transition-colors">Analytics</a>
        </div>
        <button type="button" className="px-5 py-2 rounded-full accent-gradient text-white font-semibold text-sm">
          Launch Console
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-16 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6">
          Real-time <span className="text-transparent bg-clip-text accent-gradient">Intelligence.</span>
        </h1>
        <p className="text-slate-300 max-w-2xl mx-auto text-lg mb-10">
          A high-performance interface for managing distributed systems and automated environments.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="glass p-8 rounded-3xl">
            <div className="h-2 w-12 accent-gradient rounded-full mb-6"></div>
            <h3 className="text-xl font-bold mb-2 text-slate-100">System Health</h3>
            <p className="text-slate-300 text-sm">All nodes reporting 99.9% uptime across local clusters.</p>
            <div className="mt-6 text-2xl font-mono text-emerald-400">ONLINE</div>
          </div>

          <div className="glass p-8 rounded-3xl">
            <div className="h-2 w-12 bg-purple-500 rounded-full mb-6"></div>
            <h3 className="text-xl font-bold mb-2 text-slate-100">Network Load</h3>
            <p className="text-slate-300 text-sm">Multi-gigabit backbone traffic is currently optimized.</p>
            <div className="mt-6 text-2xl font-mono text-slate-100">1.2 Gbps</div>
          </div>

          <div className="glass p-8 rounded-3xl border border-sky-500/30">
            <div className="h-2 w-12 bg-sky-400 rounded-full mb-6"></div>
            <h3 className="text-xl font-bold mb-2 text-slate-100">IoT Integration</h3>
            <p className="text-slate-300 text-sm">ESP32 sensors active. Data streaming to GCP via Pub/Sub.</p>
            <div className="mt-6 text-2xl font-mono text-sky-400">ACTIVE</div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
