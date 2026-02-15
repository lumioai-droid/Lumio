
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Session, AppView } from '../types';
import { ICONS } from '../constants';
import { geminiService, handleApiError } from '../services/geminiService';
import HistorySidebar from '../components/HistorySidebar';

const CHAT_HISTORY_KEY = 'lumio_chat_sessions_v2';

// Helper to decode base64 raw PCM
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const ChatView: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>(() => {
    try {
      const stored = localStorage.getItem(CHAT_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Local storage error:", e);
      return [];
    }
  });
  
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startOffsetRef = useRef(0);
  const startTimeRef = useRef(0);
  const currentAudioBufferRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeSession?.data]);

  const startNewChat = () => {
    const newSession: Session = {
      id: Date.now().toString(),
      title: 'New Chat',
      timestamp: Date.now(),
      view: AppView.CHAT,
      data: [{ id: '1', role: 'model', text: 'Hello! I am Lumio AI. How can I help you today?', timestamp: Date.now() }]
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSession(newSession);
  };

  useEffect(() => {
    if (sessions.length === 0) startNewChat();
    else if (!activeSession) setActiveSession(sessions[0]);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !activeSession) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    const updatedMessages = [...activeSession.data, userMsg];
    const updatedSession = { 
      ...activeSession, 
      data: updatedMessages,
      title: input.slice(0, 30) + (input.length > 30 ? '...' : '') 
    };

    setActiveSession(updatedSession);
    setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
    setInput('');
    setIsLoading(true);

    try {
      const response = await geminiService.chat(input);
      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text || "I'm sorry, I couldn't generate a response.",
        timestamp: Date.now()
      };
      
      const finalMessages = [...updatedMessages, modelMsg];
      const finalSession = { ...updatedSession, data: finalMessages };
      setActiveSession(finalSession);
      setSessions(prev => prev.map(s => s.id === finalSession.id ? finalSession : s));
    } catch (err) {
      console.error("Chat error:", err);
      try {
        await handleApiError(err);
      } catch (e) {
        const errorMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'model',
          text: `Permission Error: ${err.message || 'The AI could not respond. Please check your API key permissions.'}`,
          timestamp: Date.now()
        };
        setActiveSession(prev => prev ? { ...prev, data: [...prev.data, errorMsg] } : null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {}
      sourceNodeRef.current = null;
    }
    setSpeakingMessageId(null);
    setIsAudioPaused(false);
    startOffsetRef.current = 0;
  };

  const handleSpeak = async (message: ChatMessage) => {
    if (speakingMessageId === message.id) {
      stopAudio();
      return;
    }

    stopAudio();
    setSpeakingMessageId(message.id);
    
    try {
      const base64Audio = await geminiService.speak(message.text);
      if (!base64Audio) throw new Error("No audio returned");

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const audioBytes = decodeBase64(base64Audio);
      const buffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
      
      currentAudioBufferRef.current = buffer;
      playBuffer(0);
      
    } catch (err) {
      console.error("Speech error:", err);
      setSpeakingMessageId(null);
    }
  };

  const playBuffer = (offset: number) => {
    if (!audioContextRef.current || !currentAudioBufferRef.current) return;
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = currentAudioBufferRef.current;
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
      if (!isAudioPaused && speakingMessageId) {
        setSpeakingMessageId(null);
        startOffsetRef.current = 0;
      }
    };

    source.start(0, offset);
    sourceNodeRef.current = source;
    startTimeRef.current = audioContextRef.current.currentTime;
    startOffsetRef.current = offset;
    setIsAudioPaused(false);
  };

  const togglePause = () => {
    if (!audioContextRef.current || !sourceNodeRef.current) return;

    if (!isAudioPaused) {
      // Pausing
      const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
      startOffsetRef.current += elapsed;
      sourceNodeRef.current.stop();
      setIsAudioPaused(true);
    } else {
      // Resuming
      playBuffer(startOffsetRef.current);
      setIsAudioPaused(false);
    }
  };

  return (
    <div className="flex h-full w-full">
      <HistorySidebar 
        sessions={sessions}
        activeSessionId={activeSession?.id || null}
        onSelectSession={setActiveSession}
        onNewSession={startNewChat}
        label="Chat"
      />
      
      <div className="flex-1 flex flex-col h-full bg-[#111c2e]/30">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          {activeSession?.data.map((msg: ChatMessage) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[70%] rounded-3xl p-6 shadow-xl border relative group ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 border-white/10 text-white' 
                  : 'bg-[#1a2333] border-white/5 text-gray-100'
              }`}>
                <div className="whitespace-pre-wrap leading-relaxed text-lg">{msg.text}</div>
                
                {msg.role === 'model' && (
                  <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleSpeak(msg)}
                      className={`p-2 rounded-lg transition-all ${speakingMessageId === msg.id ? 'bg-[#00E5FF] text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                      title={speakingMessageId === msg.id ? "Stop" : "Speak"}
                    >
                      <ICONS.VOLUME size={16} />
                    </button>
                    {speakingMessageId === msg.id && (
                      <button 
                        onClick={togglePause}
                        className="p-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-all"
                        title={isAudioPaused ? "Play" : "Pause"}
                      >
                        {isAudioPaused ? <ICONS.PLAY size={16} /> : <ICONS.PAUSE size={16} />}
                      </button>
                    )}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-gray-500 mt-2 uppercase tracking-widest px-2">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-[#1a2333] border border-white/5 rounded-2xl px-6 py-4 text-[#00E5FF] font-bold uppercase tracking-widest text-xs">
                Lumio is thinking...
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-[#0b1220]/50 backdrop-blur-xl border-t border-white/5">
          <div className="max-w-4xl mx-auto relative flex items-center bg-white/5 border border-white/10 rounded-2xl p-2 group focus-within:border-[#00E5FF]/50 transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Type your message..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 py-3 px-4 resize-none h-14"
            />
            <div className="flex items-center gap-2 px-2">
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`p-3 rounded-xl transition-all ${
                  input.trim() && !isLoading ? 'bg-[#00E5FF] text-black shadow-lg shadow-[#00E5FF]/20' : 'bg-white/5 text-gray-600'
                }`}
              >
                <ICONS.SEND size={20} />
              </button>
            </div>
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

export default ChatView;
