
import React from 'react';

interface AvatarProps {
  isSpeaking?: boolean;
  isListening?: boolean;
  isMuted?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Avatar: React.FC<AvatarProps> = ({ isSpeaking, isListening, isMuted, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-24 h-24',
    lg: 'w-48 h-48',
    xl: 'w-64 h-64',
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]} transition-all duration-700`}>
      {/* Outer Glow */}
      <div className={`absolute inset-0 rounded-full transition-all duration-1000 blur-3xl ${
        isSpeaking ? 'bg-blue-500/40 scale-125' : 
        isListening ? 'bg-indigo-500/30 scale-110 animate-pulse' : 
        'bg-indigo-900/10 scale-100'
      }`} />

      {/* Main Orb Body */}
      <div className={`relative w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 shadow-2xl transition-all duration-500 ${
        isMuted ? 'opacity-50 grayscale' : 'animate-breathing'
      }`}>
        {/* Glass Effect Overlay */}
        <div className="absolute inset-0 rounded-full bg-white/20 blur-[1px] opacity-40" />
        
        {/* "Dead Face" Eye Line - Minimalist Orb Design */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-4 items-center transition-all duration-300 ${isSpeaking ? 'scale-y-125' : ''}`}>
           {/* Eyes as simple dots/lines */}
           <div className={`w-2 h-2 rounded-full bg-white shadow-sm transition-all duration-150 ${isSpeaking ? 'h-6' : 'h-2'}`} />
           <div className={`w-2 h-2 rounded-full bg-white shadow-sm transition-all duration-150 ${isSpeaking ? 'h-6' : 'h-2'}`} />
        </div>
      </div>

      <style>{`
        @keyframes breathing {
          0%, 100% { transform: scale(1); opacity: 0.95; }
          50% { transform: scale(1.03); opacity: 1; }
        }
        .animate-breathing {
          animation: breathing 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Avatar;
