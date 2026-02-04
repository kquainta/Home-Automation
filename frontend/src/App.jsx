import React from 'react';
import { Home, Settings, Activity } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Home className="text-blue-500" />
            Home Automation
          </h1>
          <nav className="flex gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Activity className="text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Settings className="text-gray-600" />
            </button>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Device Cards Placeholder */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4">Living Room Light</h2>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Status: Off</span>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                Turn On
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t p-4 text-center text-gray-500">
        <p>&copy; 2026 Home Automation Project</p>
      </footer>
    </div>
  );
}

export default App;
