
import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { Session, AppView } from '../types';
import HistorySidebar from '../components/HistorySidebar';

const PROMPT_HISTORY_KEY = 'lumio_prompt_sessions';

const PromptCreatorView: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>(() => {
    try {
      const stored = localStorage.getItem(PROMPT_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) { return []; }
  });
  
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(PROMPT_HISTORY_KEY, JSON.stringify(sessions));
  }, [sessions]);

  const startNewPrompt = () => {
    const newSession: Session = {
      id: Date.now().toString(),
      title: 'New Prompt',
      timestamp: Date.now(),
      view: AppView.PROMPT_CREATOR,
      data: { result: '' }
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSession(newSession);
    setInput('');
  };

  useEffect(() => {
    if (sessions.length === 0) startNewPrompt();
    else if (!activeSession) setActiveSession(sessions[0]);
  }, []);

  const handleConvert = async () => {
    if (!input.trim() || isLoading || !activeSession) return;
    setIsLoading(true);
    try {
      const result = await geminiService.createPrompt(input);
      const updated = {
        ...activeSession,
        title: input.slice(0, 30),
        data: { result: result || '' }
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
        onNewSession={startNewPrompt}
        label="Prompt"
      />

      <div className="flex-1 overflow-y-auto p-12 bg-[#111c2e]/30">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-black">Prompt Engineer</h2>
            <p className="text-gray-400 text-lg">Convert simple ideas into professional, high-performance prompts.</p>
            <div className="space-y-4 bg-white/5 p-8 rounded-3xl border border-white/10">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe what you want to achieve..."
                className="w-full h-32 bg-black/20 border border-white/10 rounded-2xl p-4 focus:ring-2 focus:ring-[#00E5FF] outline-none resize-none"
              />
              <button 
                onClick={handleConvert}
                disabled={isLoading}
                className="w-full py-4 bg-[#00E5FF] text-black font-black uppercase tracking-tighter rounded-2xl hover:brightness-110 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Optimizing...' : 'Create Master Prompt'}
              </button>
            </div>
          </div>

          {activeSession?.data.result && (
            <div className="bg-[#1a2333] border border-white/10 rounded-3xl p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#00E5FF]">Optimized Result</h3>
                <button 
                  onClick={() => navigator.clipboard.writeText(activeSession.data.result)}
                  className="text-xs font-bold bg-white/5 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  COPY
                </button>
              </div>
              <div className="bg-black/40 rounded-2xl p-6 font-mono text-sm leading-relaxed text-indigo-100 whitespace-pre-wrap">
                {activeSession.data.result}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptCreatorView;
