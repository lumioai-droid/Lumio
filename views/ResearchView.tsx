
import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { Session, AppView } from '../types';
import HistorySidebar from '../components/HistorySidebar';

const RESEARCH_HISTORY_KEY = 'lumio_research_sessions';

const ResearchView: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>(() => {
    const stored = localStorage.getItem(RESEARCH_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(RESEARCH_HISTORY_KEY, JSON.stringify(sessions));
  }, [sessions]);

  const startNewResearch = () => {
    const newSession: Session = {
      id: Date.now().toString(),
      title: 'New Research',
      timestamp: Date.now(),
      view: AppView.RESEARCH,
      data: { result: null, sources: [] }
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSession(newSession);
    setQuery('');
  };

  useEffect(() => {
    if (sessions.length === 0) startNewResearch();
    else if (!activeSession) setActiveSession(sessions[0]);
  }, []);

  const handleSearch = async () => {
    if (!query.trim() || isLoading || !activeSession) return;
    setIsLoading(true);
    
    try {
      const response = await geminiService.research(query);
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = chunks.filter((c: any) => c.web).map((c: any) => c.web);
      
      const updatedSession = {
        ...activeSession,
        title: query.slice(0, 30),
        data: { result: response.text, sources }
      };
      
      setActiveSession(updatedSession);
      setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
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
        onNewSession={startNewResearch}
        label="Research"
      />

      <div className="flex-1 overflow-y-auto p-12 bg-[#111c2e]/30">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="space-y-6">
            <h2 className="text-4xl font-black tracking-tight">AI Research Lab</h2>
            <div className="flex gap-4 p-2 bg-white/5 border border-white/10 rounded-2xl">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Deep dive into any topic with Google Search grounding..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-white px-4"
              />
              <button 
                onClick={handleSearch}
                disabled={isLoading || !query.trim()}
                className="bg-[#00E5FF] text-black px-8 py-3 rounded-xl font-bold hover:brightness-110 disabled:opacity-50 transition-all"
              >
                {isLoading ? 'Analyzing...' : 'Execute'}
              </button>
            </div>
          </div>

          {activeSession?.data.result ? (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-[#1a2333] border border-white/10 rounded-3xl p-10 leading-relaxed shadow-2xl">
                <div className="prose prose-invert max-w-none">
                   <div className="whitespace-pre-wrap text-lg text-gray-200">{activeSession.data.result}</div>
                </div>
              </div>

              {activeSession.data.sources.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Credible Sources</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeSession.data.sources.map((source: any, idx: number) => (
                      <a 
                        key={idx} 
                        href={source.uri} 
                        target="_blank" 
                        className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-[#00E5FF]/10 hover:border-[#00E5FF]/30 transition-all group"
                      >
                        <div className="font-bold mb-1 truncate group-hover:text-[#00E5FF]">{source.title}</div>
                        <div className="text-[10px] text-gray-600 truncate">{source.uri}</div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-40 text-center opacity-20">
               <p className="text-xl font-medium italic">Ready for your next investigation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResearchView;
