
import React from 'react';

const SettingsView: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      <section className="space-y-4">
        <h3 className="text-sm font-bold text-gray-500 uppercase">Account</h3>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500" />
            <div>
              <div className="font-bold">Guest User</div>
              <div className="text-xs text-gray-500">guest@lumio.ai</div>
            </div>
          </div>
          <button className="text-indigo-400 font-bold text-sm">Sign In</button>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-bold text-gray-500 uppercase">Voice & Personality</h3>
        <div className="space-y-2">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <span>Voice Response Mode</span>
            <div className="w-12 h-6 bg-indigo-600 rounded-full relative">
               <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md" />
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <span>AI Personality</span>
            <select className="bg-transparent border-none focus:ring-0 text-indigo-400 font-bold">
              <option>Humanistic / Warm</option>
              <option>Professional / Technical</option>
              <option>Creative / Wild</option>
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-bold text-gray-500 uppercase">History</h3>
        <button className="w-full bg-red-500/10 border border-red-500/20 text-red-500 py-3 rounded-2xl font-bold hover:bg-red-500/20 transition-all">
          Clear Conversation History
        </button>
      </section>

      <div className="text-center pt-10 text-gray-600 text-xs">
        Lumio AI v1.0.4 • Powered by Google Gemini
      </div>
    </div>
  );
};

export default SettingsView;
