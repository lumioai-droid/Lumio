
import React from 'react';
import { Session } from '../types';

interface HistorySidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (session: Session) => void;
  onNewSession: () => void;
  label: string;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ 
  sessions, 
  activeSessionId, 
  onSelectSession, 
  onNewSession,
  label
}) => {
  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="w-64 h-full bg-[#0b1220] border-r border-white/5 flex flex-col p-4 shrink-0 overflow-hidden">
      {/* Cyan New Button */}
      <button 
        onClick={onNewSession}
        className="w-full bg-[#00E5FF] hover:bg-[#00B8CC] text-black font-bold py-3 rounded-lg mb-6 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
      >
        <span className="text-xl">+</span>
        <span>New {label}</span>
      </button>

      {/* History List */}
      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
        {sessions.length === 0 ? (
          <div className="text-gray-600 text-xs text-center py-10 italic">No history yet</div>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session)}
              className={`w-full text-left p-3 rounded-xl border transition-all group ${
                activeSessionId === session.id 
                  ? 'bg-white/10 border-[#00E5FF]/30' 
                  : 'bg-white/5 border-transparent hover:bg-white/10'
              }`}
            >
              <div className="font-medium text-sm text-gray-200 truncate group-hover:text-white">
                {session.title || `New ${label}`}
              </div>
              <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
                {formatDate(session.timestamp)}
              </div>
            </button>
          ))
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default HistorySidebar;
