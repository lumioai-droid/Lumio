
export enum AppView {
  LANDING = 'landing',
  CHAT = 'chat',
  LIVE = 'live',
  RESEARCH = 'research',
  PROMPT_CREATOR = 'prompt_creator',
  VIRTUAL_CREATOR = 'virtual_creator',
  SLIDE_MAKER = 'slide_maker',
  MEDIA = 'media',
  SETTINGS = 'settings'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  type?: 'text' | 'image' | 'code';
  metadata?: any;
}

export interface Session {
  id: string;
  title: string;
  timestamp: number;
  view: AppView;
  data: any;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface VoiceState {
  isSpeaking: boolean;
  isMuted: boolean;
  isListening: boolean;
}

export type LayoutType = 'SPLIT' | 'HERO' | 'GRID' | 'FEATURE' | 'MINIMAL';

export interface SlideData {
  title: string;
  bullets: string[];
  imagePrompt: string;
  imageUrl?: string;
  layoutType: LayoutType;
  accentColor?: string;
}
