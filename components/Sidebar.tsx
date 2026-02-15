
import React from 'react';
import { AppView } from '../types';
import { ICONS } from '../constants';

interface SidebarProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const navItems = [
    { id: AppView.CHAT, icon: ICONS.CHAT, label: 'Chat' },
    { id: AppView.LIVE, icon: ICONS.LIVE, label: 'Live' },
    { id: AppView.RESEARCH, icon: ICONS.RESEARCH, label: 'Research' },
    { id: AppView.MEDIA, icon: (props: any) => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ), label: 'Creative Studio' },
    { id: AppView.PROMPT_CREATOR, icon: ICONS.PROMPT, label: 'Prompt Engineer' },
    { id: AppView.VIRTUAL_CREATOR, icon: ICONS.VIRTUAL, label: 'Virtual Build' },
    { id: AppView.SLIDE_MAKER, icon: ICONS.SLIDE, label: 'Slide Studio' },
    { id: AppView.SETTINGS, icon: ICONS.SETTINGS, label: 'Settings' },
  ];

  return (
    <aside className="w-20 md:w-64 border-r border-white/10 flex flex-col items-center md:items-stretch py-8 bg-black/20 shrink-0">
      <div className="px-6 mb-10 hidden md:block">
        <div className="flex items-center gap-3">
          {/* New Celestial Branding Icon */}
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 animate-pulse" />
            <div className="w-1.5 h-1.5 bg-white rounded-full z-10 shadow-[0_0_8px_#fff]" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Lumio</span>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-2 px-3 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
              activeView === item.id 
                ? 'bg-white/10 text-white' 
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
            }`}
          >
            <item.icon className={`transition-transform duration-200 ${activeView === item.id ? 'scale-110 text-cyan-400' : 'group-hover:scale-105'}`} />
            <span className="hidden md:block font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
      `}</style>
    </aside>
  );
};

export default Sidebar;
