
import React, { useState, useEffect } from 'react';
import { AppView } from './types';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import ChatView from './views/ChatView';
import LiveView from './views/LiveView';
import ResearchView from './views/ResearchView';
import PromptCreatorView from './views/PromptCreatorView';
import VirtualCreatorView from './views/VirtualCreatorView';
import SlideMakerView from './views/SlideMakerView';
import SettingsView from './views/SettingsView';
import LandingView from './views/LandingView';
import MediaGeneratorView from './views/MediaGeneratorView';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>(AppView.LANDING);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderView = () => {
    switch (activeView) {
      case AppView.LANDING: return <LandingView onEnter={(view) => setActiveView(view)} />;
      case AppView.CHAT: return <ChatView />;
      case AppView.LIVE: return <LiveView />;
      case AppView.RESEARCH: return <ResearchView />;
      case AppView.PROMPT_CREATOR: return <PromptCreatorView />;
      case AppView.VIRTUAL_CREATOR: return <VirtualCreatorView />;
      case AppView.SLIDE_MAKER: return <SlideMakerView />;
      case AppView.MEDIA: return <MediaGeneratorView />;
      case AppView.SETTINGS: return <SettingsView />;
      default: return <ChatView />;
    }
  };

  const isLanding = activeView === AppView.LANDING;

  return (
    <div className="flex h-screen w-full bg-[#02050f] text-white overflow-hidden">
      {!isLanding && !isMobile && <Sidebar activeView={activeView} onViewChange={setActiveView} />}
      
      <main className={`flex-1 flex flex-col relative overflow-hidden ${isLanding ? '' : 'pb-[72px] md:pb-0'}`}>
        {!isLanding && (
          <header className="h-16 flex items-center justify-between px-6 border-b border-white/10 shrink-0 bg-black/20 backdrop-blur-md z-20">
            <div className="flex items-center gap-3">
              {isMobile && <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-600 to-purple-600 flex items-center justify-center font-bold text-xs shadow-lg shadow-cyan-500/20">L</div>}
              <h1 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                Lumio AI
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setActiveView(AppView.LANDING)}
                className="text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-cyan-400 transition-colors"
              >
                Reset Epoch
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center text-xs font-bold ring-2 ring-white/10 shadow-lg shadow-blue-500/20">
                LA
              </div>
            </div>
          </header>
        )}

        <div className="flex-1 overflow-y-auto scroll-smooth">
          {renderView()}
        </div>
      </main>

      {!isLanding && isMobile && <BottomNav activeView={activeView} onViewChange={setActiveView} />}
    </div>
  );
};

export default App;
