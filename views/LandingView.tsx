
import React from 'react';
import { AppView } from '../types';

interface LandingViewProps {
  onEnter: (view: AppView) => void;
}

const LandingView: React.FC<LandingViewProps> = ({ onEnter }) => {
  return (
    <div 
      className="relative h-screen w-full flex items-center justify-center bg-[#02050f] overflow-hidden cursor-pointer"
      onClick={() => onEnter(AppView.CHAT)}
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#0a1229_0%,#02050f_100%)] opacity-100" />
      
      {/* Subtle Grid / Texture */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#4f46e5 0.5px, transparent 0.5px), linear-gradient(90deg, #4f46e5 0.5px, transparent 0.5px)', backgroundSize: '40px 40px' }} />

      {/* Main Brand Container */}
      <div className="relative z-10 flex flex-col items-center">
        
        {/* Neon Logo Group */}
        <div className="flex items-center justify-center gap-0 animate-in fade-in zoom-in duration-1000">
          <h1 className="text-7xl md:text-[120px] font-['Inter'] font-black tracking-[-0.05em] flex items-center leading-none">
            {/* "LUMI" Text with Neon Gradient */}
            <span className="bg-gradient-to-r from-[#a855f7] via-[#3b82f6] to-[#06b6d4] bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              LUMI
            </span>
            
            {/* Adjusted Celestial "O" Graphic - Now proportional to text height */}
            <div className="relative w-[70px] h-[70px] md:w-[110px] md:h-[110px] flex items-center justify-center ml-1">
              {/* Outer Orbiting Ring */}
              <div className="absolute w-[150%] h-[50%] border border-[#6366f1]/30 rounded-[100%] rotate-[-25deg] shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                {/* Orbiting Particles */}
                <div className="absolute top-0 left-1/4 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_#fff]" />
                <div className="absolute bottom-0 right-1/4 w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_6px_#22d3ee]" />
              </div>
              
              {/* Main Glowing Ring */}
              <div className="absolute inset-0 rounded-full border-[4px] md:border-[8px] border-transparent bg-gradient-to-br from-[#06b6d4] via-[#3b82f6] to-[#a855f7] shadow-[0_0_30px_rgba(59,130,246,0.5)] p-[2px] overflow-hidden">
                <div className="w-full h-full rounded-full bg-[#02050f] flex items-center justify-center">
                   {/* Inner Sphere Core */}
                   <div className="w-[85%] h-[85%] rounded-full bg-gradient-to-tr from-[#1e1b4b] via-[#312e81] to-[#4338ca] opacity-90 shadow-inner" />
                </div>
              </div>

              {/* Central Pulse Dot */}
              <div className="absolute w-3 h-3 bg-white rounded-full blur-[1px] animate-pulse shadow-[0_0_15px_#fff]" />
            </div>
          </h1>
        </div>

        {/* Tagline */}
        <div className="mt-6 text-center tracking-[0.8em] md:tracking-[1.2em] text-cyan-400/60 font-['Montserrat'] font-light text-xs md:text-sm uppercase animate-in slide-in-from-bottom-8 duration-1000 delay-300 select-none">
          Neural Intelligence
        </div>
      </div>

      {/* Entry Hint - Bottom Position */}
      <div className="absolute bottom-16 left-0 right-0 flex flex-col items-center gap-4 opacity-40 hover:opacity-100 transition-opacity z-20">
         <div className="text-[10px] font-['Montserrat'] tracking-[0.6em] uppercase text-cyan-400 font-bold">Initialize Connection</div>
         <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
      </div>

      {/* Random Floating Particles */}
      {[...Array(20)].map((_, i) => (
        <div 
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full opacity-10 animate-float"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 10}s`
          }}
        />
      ))}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.1; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 0.3; }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingView;
