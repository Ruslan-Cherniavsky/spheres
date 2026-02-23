export type AuraType =
  | 'enlightened'
  | 'inspiration'
  | 'joy'
  | 'gratitude'
  | 'confidence'
  | 'calm'
  | 'neutral'
  | 'doubt'
  | 'anxiety'
  | 'sadness'
  | 'apathy'
  | 'irritation'
  | 'anger'
  | 'despair'
  | 'hopelessness'
  | 'sos';

export type PlayerStatus = 'idle' | 'requesting' | 'chatting';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface PlayerState {
  uid: string;
  position: Vec3;
  rotation?: Quaternion;
  aura: AuraType;
  coreValue: number;
  status: PlayerStatus;
  isAI?: boolean;
  lastUpdateTs: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  language: SupportedLanguage;
  aura: AuraType;
  coreValue: number;
  createdAt: number;
  updatedAt: number;
}

export interface ReportRecord {
  reporterUid: string;
  targetUid: string;
  timestamp: number;
  worldId: string;
}

export type SupportedLanguage = 'en' | 'he' | 'ru';
