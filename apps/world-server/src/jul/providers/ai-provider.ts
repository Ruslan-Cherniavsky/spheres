import type { JUL_CHARACTER_PROMPT } from '../personality.js';
import type { UserRelationship } from '../memory.js';

export interface DialogueContext {
  interactionType: 'greeting' | 'reply' | 'farewell';
  userMessage?: string;
  recentMessages: Array<{ role: 'jul' | 'user'; text: string }>;
  mood: number;
  energy: number;
  personality: typeof JUL_CHARACTER_PROMPT;
  relationship: UserRelationship;
}

export interface SummaryContext {
  messages: Array<{ role: 'jul' | 'user'; text: string }>;
  relationship: UserRelationship;
}

export interface AIProvider {
  generateReply(context: DialogueContext): Promise<string>;
  summarizeConversation(context: SummaryContext): Promise<string>;
}
