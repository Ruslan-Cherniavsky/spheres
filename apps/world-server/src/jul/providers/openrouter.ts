import type { AIProvider, DialogueContext, SummaryContext } from './ai-provider.js';
import { buildDialoguePrompt, buildSummaryPrompt } from '../prompt.js';

const MODEL = 'openrouter/free';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const TIMEOUT_MS = 10_000;

const FALLBACKS = ['...', 'Hmm...', 'I need a moment...', '*looks away shyly*'];

interface ChatCompletion {
  choices?: Array<{ message?: { content?: string } }>;
}

function randomFallback(): string {
  return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
}

export class OpenRouterProvider implements AIProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[jul-ai] OPENROUTER_API_KEY not set — will use fallback phrases');
    }
  }

  async generateReply(context: DialogueContext): Promise<string> {
    if (!this.apiKey) return randomFallback();

    try {
      const messages = buildDialoguePrompt(context);
      const body = {
        model: MODEL,
        messages,
        max_tokens: 150,
        temperature: 0.8,
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://spheres.app',
          'X-Title': 'Spheres',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const errText = await res.text().catch(() => 'unknown');
        console.error(`[jul-ai] API error ${res.status}: ${errText}`);
        return randomFallback();
      }

      const data = (await res.json()) as ChatCompletion;
      const text = data?.choices?.[0]?.message?.content?.trim();
      if (!text) {
        console.warn('[jul-ai] empty response from API');
        return randomFallback();
      }

      console.log(`[jul-ai] reply generated (${text.length} chars)`);
      return text;
    } catch (err) {
      console.error('[jul-ai] generateReply failed:', (err as Error).message);
      return randomFallback();
    }
  }

  async summarizeConversation(context: SummaryContext): Promise<string> {
    if (!this.apiKey) return 'Had a conversation.';

    try {
      const messages = buildSummaryPrompt(context.messages, context.relationship);
      const body = {
        model: MODEL,
        messages,
        max_tokens: 200,
        temperature: 0.4,
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://spheres.app',
          'X-Title': 'Spheres',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        console.error(`[jul-ai] summarize API error ${res.status}`);
        return 'Had a conversation.';
      }

      const data = (await res.json()) as ChatCompletion;
      const text = data?.choices?.[0]?.message?.content?.trim();
      if (!text) return 'Had a conversation.';

      console.log(`[jul-ai] summary generated (${text.length} chars)`);
      return text;
    } catch (err) {
      console.error('[jul-ai] summarizeConversation failed:', (err as Error).message);
      return 'Had a conversation.';
    }
  }
}
