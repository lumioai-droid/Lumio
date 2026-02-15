
import React from 'react';
import { AppView } from '../types';
import { ICONS } from '../constants';

interface BottomNavProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeView, onViewChange }) => {
  const navItems = [
    { id: AppView.CHAT, icon: ICONS.CHAT },
    { id: AppView.LIVE, icon: ICONS.LIVE },
    { id: AppView.RESEARCH, icon: ICONS.RESEARCH },
    { id: AppView.SLIDE_MAKER, icon: ICONS.SLIDE },
    { id: AppView.SETTINGS, icon: ICONS.SETTINGS },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[72px] bg-[#0b1220]/80 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-4 z-50">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onViewChange(item.id)}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all ${
            activeView === item.id ? 'text-indigo-400 bg-white/10' : 'text-gray-500'
          }`}
        >
          <item.icon />
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
