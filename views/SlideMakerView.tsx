
import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { ICONS } from '../constants';
import { Session, AppView, SlideData } from '../types';
import HistorySidebar from '../components/HistorySidebar';

const SLIDE_HISTORY_KEY = 'lumio_slide_sessions';

const SlideMakerView: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>(() => {
    const stored = localStorage.getItem(SLIDE_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const slidesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(SLIDE_HISTORY_KEY, JSON.stringify(sessions));
  }, [sessions]);

  const startNewPresentation = () => {
    const newSession: Session = {
      id: Date.now().toString(),
      title: 'New Deck',
      timestamp: Date.now(),
      view: AppView.SLIDE_MAKER,
      data: []
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSession(newSession);
    setTopic('');
  };

  useEffect(() => {
    if (sessions.length === 0) startNewPresentation();
    else if (!activeSession) setActiveSession(sessions[0]);
  }, []);

  const handleGenerate = async () => {
    if (!topic.trim() || isLoading || !activeSession) return;
    setIsLoading(true);
    setProgress('Drafting Narrative...');
    
    try {
      const structure = await geminiService.generateSlides(topic);
      let currentSlides = structure.map((s: any) => ({ ...s, imageUrl: null }));
      
      const sessionWithStructure = { ...activeSession, title: topic.slice(0, 30), data: currentSlides };
      setActiveSession(sessionWithStructure);
      setSessions(prev => prev.map(s => s.id === sessionWithStructure.id ? sessionWithStructure : s));

      for (let i = 0; i < currentSlides.length; i++) {
        setProgress(`Visualizing Slide ${i + 1}...`);
        const url = await geminiService.generateImage(currentSlides[i].imagePrompt);
        if (url) {
          currentSlides[i].imageUrl = url;
          const updated = { ...activeSession, data: [...currentSlides] };
          setActiveSession(updated);
          setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setProgress('');
    }
  };

  const renderSlide = (slide: SlideData, index: number) => {
    const accent = slide.accentColor || '#6366f1';
    
    switch (slide.layoutType) {
      case 'HERO':
        return (
          <div key={index} className="slide-element relative aspect-video w-full max-w-4xl bg-[#0b1220] rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center p-12 group">
            {slide.imageUrl && <img src={slide.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-40" />}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b1220] via-transparent to-transparent" />
            <div className="relative z-10 text-center">
              <h3 className="text-5xl font-black mb-6" style={{ color: 'white' }}>{slide.title}</h3>
            </div>
          </div>
        );
      case 'SPLIT':
        return (
          <div key={index} className="slide-element relative aspect-video w-full max-w-4xl bg-[#0b1220] rounded-3xl overflow-hidden shadow-2xl flex border border-white/5">
            <div className="flex-1 p-12 flex flex-col justify-center">
              <h3 className="text-3xl font-bold mb-6">{slide.title}</h3>
              <ul className="space-y-3">
                {slide.bullets.map((b, i) => (
                  <li key={i} className="text-gray-400 text-lg flex gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] mt-2.5 shrink-0" />{b}</li>
                ))}
              </ul>
            </div>
            <div className="flex-1 relative">
              {slide.imageUrl && <img src={slide.imageUrl} className="w-full h-full object-cover" />}
            </div>
          </div>
        );
      default:
        return (
          <div key={index} className="slide-element relative aspect-video w-full max-w-4xl bg-[#1a2333] border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col p-12">
            <h3 className="text-4xl font-bold mb-10">{slide.title}</h3>
            <ul className="space-y-4">
              {slide.bullets.map((b, i) => (
                <li key={i} className="text-gray-300 text-xl flex gap-4"><div className="w-2 h-2 rounded-full bg-indigo-500 mt-2.5 shrink-0" />{b}</li>
              ))}
            </ul>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full w-full">
      <HistorySidebar 
        sessions={sessions}
        activeSessionId={activeSession?.id || null}
        onSelectSession={setActiveSession}
        onNewSession={startNewPresentation}
        label="Deck"
      />

      <div className="flex-1 overflow-y-auto p-12 bg-[#111c2e]/30">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Slide Studio</h2>
            <div className="flex gap-4">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                placeholder="Theme or topic for your presentation..."
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[#00E5FF]/50"
              />
              <button 
                onClick={handleGenerate}
                disabled={isLoading}
                className="bg-[#00E5FF] text-black px-10 rounded-2xl font-black uppercase tracking-tighter hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Generate'}
              </button>
            </div>
            {progress && <div className="text-indigo-400 text-sm animate-pulse flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />{progress}</div>}
          </div>

          <div className="space-y-20 pb-40" ref={slidesRef}>
            {activeSession?.data.map((slide: SlideData, idx: number) => renderSlide(slide, idx))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideMakerView;
