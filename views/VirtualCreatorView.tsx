
import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { Session, AppView } from '../types';
import HistorySidebar from '../components/HistorySidebar';

const VIRTUAL_HISTORY_KEY = 'lumio_virtual_sessions';

const VirtualCreatorView: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>(() => {
    try {
      const stored = localStorage.getItem(VIRTUAL_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) { return []; }
  });
  
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [instruction, setInstruction] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(VIRTUAL_HISTORY_KEY, JSON.stringify(sessions));
  }, [sessions]);

  const startNewBuild = () => {
    const newSession: Session = {
      id: Date.now().toString(),
      title: 'New App',
      timestamp: Date.now(),
      view: AppView.VIRTUAL_CREATOR,
      data: { code: '' }
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSession(newSession);
    setInstruction('');
  };

  useEffect(() => {
    if (sessions.length === 0) startNewBuild();
    else if (!activeSession) setActiveSession(sessions[0]);
  }, []);

  const handleCreate = async () => {
    if (!instruction.trim() || isLoading || !activeSession) return;
    setIsLoading(true);
    try {
      const result = await geminiService.generateCode(instruction);
      const cleaned = result?.replace(/```html|```css|```javascript|```/gi, '').trim() || '';
      const updated = {
        ...activeSession,
        title: instruction.slice(0, 30),
        data: { code: cleaned }
      };
      setActiveSession(updated);
      setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full">
      <HistorySidebar 
        sessions={sessions}
        activeSessionId={activeSession?.id || null}
        onSelectSession={setActiveSession}
        onNewSession={startNewBuild}
        label="Build"
      />

      <div className="flex-1 flex flex-col h-full bg-[#111c2e]/30 p-6 gap-6">
        <div className="flex flex-col md:flex-row gap-4 items-start shrink-0">
          <div className="flex-1 w-full relative">
            <input
              type="text"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="What should I build? (e.g., 'A modern BMI calculator')"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[#00E5FF]/50 transition-all"
            />
          </div>
          <button 
            onClick={handleCreate}
            disabled={isLoading}
            className="bg-[#00E5FF] text-black px-10 py-4 rounded-2xl font-black uppercase tracking-tighter hover:brightness-110 transition-all disabled:opacity-50 w-full md:w-auto"
          >
            {isLoading ? 'Building...' : 'Execute'}
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0">
          <div className="flex-1 flex flex-col bg-black/40 rounded-3xl border border-white/10 overflow-hidden">
            <div className="bg-white/5 px-6 py-3 border-b border-white/10 text-[10px] font-bold tracking-widest uppercase text-gray-500 flex justify-between">
              <span>SOURCE CODE</span>
              <button 
                onClick={() => activeSession && navigator.clipboard.writeText(activeSession.data.code)} 
                className="hover:text-white"
              >
                Copy
              </button>
            </div>
            <textarea
              value={activeSession?.data.code || ''}
              readOnly
              className="flex-1 bg-transparent p-6 font-mono text-sm resize-none focus:outline-none text-indigo-300 custom-scrollbar"
              spellCheck={false}
            />
          </div>

          <div className="flex-1 flex flex-col bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-gray-100 px-6 py-3 border-b border-gray-200 text-[10px] font-black tracking-widest uppercase text-gray-400">
              NEURAL PREVIEW
            </div>
            <iframe
              srcDoc={activeSession?.data.code || ''}
              title="Preview"
              className="flex-1 w-full border-none"
            />
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default VirtualCreatorView;
