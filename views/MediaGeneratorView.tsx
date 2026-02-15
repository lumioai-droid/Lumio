
import React, { useState, useEffect } from 'react';
import { geminiService, handleApiError } from '../services/geminiService';
import { Session, AppView } from '../types';
import HistorySidebar from '../components/HistorySidebar';

const MEDIA_HISTORY_KEY = 'lumio_media_sessions';

const MediaGeneratorView: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>(() => {
    try {
      const stored = localStorage.getItem(MEDIA_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) { return []; }
  });
  
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState<'image' | 'video'>('image');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageSize, setImageSize] = useState('1K');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    localStorage.setItem(MEDIA_HISTORY_KEY, JSON.stringify(sessions));
  }, [sessions]);

  const startNewMedia = () => {
    const newSession: Session = {
      id: Date.now().toString(),
      title: 'New Vision',
      timestamp: Date.now(),
      view: AppView.MEDIA,
      data: { resultUrl: null, type: 'image' }
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSession(newSession);
    setPrompt('');
  };

  useEffect(() => {
    if (sessions.length === 0) startNewMedia();
    else if (!activeSession) setActiveSession(sessions[0]);
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading || !activeSession) return;
    setIsLoading(true);
    setStatus('Initializing AI models...');

    try {
      const needsPaidKey = type === 'video' || (type === 'image' && (imageSize === '2K' || imageSize === '4K'));
      
      // Check for paid key capability
      // @ts-ignore
      if (needsPaidKey && window.aistudio) {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          setStatus('Requires paid project API key. Opening selection...');
          // @ts-ignore
          await window.aistudio.openSelectKey();
        }
      }

      let url: string | null = null;
      if (type === 'image') {
        setStatus('Generating high-fidelity image...');
        url = await geminiService.generateImage(prompt, { aspectRatio, size: imageSize });
      } else {
        setStatus('Rendering cinematic video. This may take 1-2 minutes...');
        url = await geminiService.generateVideo(prompt, aspectRatio);
      }
      
      if (url) {
        const updated = {
          ...activeSession,
          title: prompt.slice(0, 30),
          data: { resultUrl: url, type }
        };
        setActiveSession(updated);
        setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
      }
    } catch (err: any) {
      console.error("Media generation failed:", err);
      const is403 = err.message?.includes("403") || err.message?.toLowerCase().includes("permission");
      setStatus(is403 ? "Permission denied. Please ensure you've selected a valid key from a paid project." : `Error: ${err.message || 'Unexpected error'}`);
      
      // Explicitly trigger select key on permission errors
      if (is403) {
        await handleApiError(err);
      }
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
        onNewSession={startNewMedia}
        label="Creation"
      />

      <div className="flex-1 overflow-y-auto p-12 bg-[#111c2e]/30">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
            <div className="flex gap-4">
              <button 
                onClick={() => { setType('image'); setAspectRatio('1:1'); }}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${type === 'image' ? 'bg-[#00E5FF] text-black shadow-[0_0_20px_rgba(0,229,255,0.3)]' : 'bg-white/5 text-gray-400'}`}
              >
                Image Studio
              </button>
              <button 
                onClick={() => { setType('video'); setAspectRatio('16:9'); }}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${type === 'video' ? 'bg-[#00E5FF] text-black shadow-[0_0_20px_rgba(0,229,255,0.3)]' : 'bg-white/5 text-gray-400'}`}
              >
                Video Cinematic
              </button>
            </div>

            <div className="space-y-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`Describe your ${type} vision in detail...`}
                className="w-full h-32 bg-black/20 border border-white/10 rounded-xl p-4 focus:ring-2 focus:ring-[#00E5FF] outline-none text-white resize-none transition-all"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Aspect Ratio</label>
                  <select 
                    value={aspectRatio} 
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full bg-[#1a2333] border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:ring-1 focus:ring-[#00E5FF]"
                  >
                    {type === 'image' ? (
                      <>
                        <option value="1:1">Square (1:1)</option>
                        <option value="16:9">Widescreen (16:9)</option>
                        <option value="9:16">Portrait (9:16)</option>
                        <option value="4:3">Standard (4:3)</option>
                      </>
                    ) : (
                      <>
                        <option value="16:9">Widescreen (16:9)</option>
                        <option value="9:16">Portrait (9:16)</option>
                      </>
                    )}
                  </select>
                </div>
                {type === 'image' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Resolution</label>
                    <select 
                      value={imageSize} 
                      onChange={(e) => setImageSize(e.target.value)}
                      className="w-full bg-[#1a2333] border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:ring-1 focus:ring-[#00E5FF]"
                    >
                      <option value="1K">1K (Standard)</option>
                      <option value="2K">2K (High Def - Requires Key)</option>
                      <option value="4K">4K (Ultra HD - Requires Key)</option>
                    </select>
                  </div>
                )}
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full py-4 bg-[#00E5FF] text-black rounded-xl font-black uppercase tracking-tighter text-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isLoading ? 'Processing Vision...' : `Generate ${type}`}
              </button>
            </div>
          </div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-12 h-12 border-4 border-[#00E5FF] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#00E5FF] font-medium animate-pulse text-center px-4">{status}</p>
            </div>
          )}

          {activeSession?.data.resultUrl && !isLoading && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-black/40 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                {activeSession.data.type === 'image' ? (
                  <img src={activeSession.data.resultUrl} alt="Generated result" className="w-full h-auto" />
                ) : (
                  <video src={activeSession.data.resultUrl} controls className="w-full h-auto" autoPlay />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaGeneratorView;
