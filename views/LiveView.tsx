
import React, { useState, useEffect, useRef } from 'react';
import Avatar from '../components/Avatar';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ICONS } from '../constants';

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
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

const LiveView: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const startSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(err => {
        console.error("Microphone access denied:", err);
        throw err;
      });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              if (isMuted) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmData = new Uint8Array(int16.buffer);
              const base64Data = encode(pcmData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' } });
              }).catch(() => {});
            };
            source.connect(processor);
            processor.connect(inputCtx.destination);
            setIsActive(true);
            setIsListening(true);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.interrupted) {
              for (const source of sourcesRef.current.values()) {
                try { source.stop(); } catch (e) {}
                sourcesRef.current.delete(source);
              }
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
              return;
            }

            const audioStr = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioStr) {
              setIsSpeaking(true);
              const data = decode(audioStr);
              const buffer = await decodeAudioData(data, outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsSpeaking(false);
              };
            }
          },
          onerror: (e) => {
            console.error('Live connection error:', e);
            setIsActive(false);
          },
          onclose: () => {
            setIsActive(false);
            setIsListening(false);
            setIsSpeaking(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }
        }
      });
      sessionPromise.catch(err => {
        console.error("Session connection failed:", err);
        setIsActive(false);
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (err) {
      console.error("Live start failed:", err);
      setIsActive(false);
    }
  };

  const toggleSession = () => {
    if (isActive) {
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioContextRef.current?.close().catch(() => {});
      setIsActive(false);
    } else {
      startSession();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="mb-12 relative">
        <Avatar size="xl" isSpeaking={isSpeaking} isListening={isActive && !isMuted} isMuted={isMuted} />
        {isActive && (
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-[#00E5FF] text-black text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full animate-pulse shadow-lg shadow-[#00E5FF]/50">
            Live Interface Active
          </div>
        )}
      </div>

      <div className="text-center mb-16 space-y-2">
        <h2 className="text-4xl font-black">
          {isActive ? (isMuted ? 'Interface Muted' : 'Lumio is listening...') : 'Neural Voice'}
        </h2>
        <p className="text-gray-400 max-w-sm mx-auto text-lg">
          {isActive 
            ? "Speak naturally. I can process your intent in real-time."
            : "Tap to initialize a high-bandwidth voice connection."}
        </p>
      </div>

      <div className="flex items-center gap-6">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className={`p-6 rounded-2xl border transition-all ${
            isMuted ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 shadow-lg'
          }`}
        >
          <ICONS.MIC className={isMuted ? 'stroke-[2.5]' : ''} />
        </button>

        <button 
          onClick={toggleSession}
          className={`px-12 py-6 rounded-2xl font-black text-xl uppercase tracking-tighter shadow-2xl transition-all hover:scale-105 active:scale-95 ${
            isActive 
              ? 'bg-red-600 shadow-red-900/40 text-white' 
              : 'bg-[#00E5FF] shadow-indigo-900/40 text-black'
          }`}
        >
          {isActive ? 'Disconnect' : 'Start Talking'}
        </button>

        <button className="p-6 rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 transition-all shadow-lg">
          <ICONS.SETTINGS />
        </button>
      </div>
    </div>
  );
};

export default LiveView;
