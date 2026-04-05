import type { AIProvider, DialogueContext, SummaryContext } from './ai-provider.js';
import { buildDialoguePrompt, buildSummaryPrompt } from '../prompt.js';

const MODELS = ['qwen/qwen3.6-plus:free', 'meta-llama/llama-3.3-70b-instruct:free', 'openrouter/free'];
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const TIMEOUT_MS = 15_000;
const REPLY_MAX_TOKENS = 512;
const SUMMARY_MAX_TOKENS = 512;

const FALLBACKS = ['...', 'Hmm...'];

interface ChatCompletion {
  model?: string;
  choices?: Array<{ message?: { content?: string } }>;
}

function randomFallback(): string {
  return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
}

function extractContent(data: ChatCompletion): string | null {
  const raw = data?.choices?.[0]?.message?.content?.trim();
  if (!raw || raw.length < 1) return null;
  return raw;
}

export class OpenRouterProvider implements AIProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[jul-ai] OPENROUTER_API_KEY not set — will use fallback phrases');
    }
  }

  private async call(
    messages: Array<{ role: string; content: string }>,
    temperature: number,
    maxTokens: number,
  ): Promise<{ text: string | null; model: string | null }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://spheres.app',
          'X-Title': 'Spheres',
        },
        body: JSON.stringify({
          models: MODELS,
          messages,
          max_tokens: maxTokens,
          temperature,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error(`[jul-ai] API ${res.status}: ${errText.slice(0, 200)}`);
        return { text: null, model: null };
      }

      const data = (await res.json()) as ChatCompletion;
      return { text: extractContent(data), model: data.model ?? null };
    } catch (err) {
      clearTimeout(timeout);
      console.error('[jul-ai] request failed:', (err as Error).message);
      return { text: null, model: null };
    }
  }

  async generateReply(context: DialogueContext): Promise<string> {
    if (!this.apiKey) return randomFallback();

    const messages = buildDialoguePrompt(context);
    const { text, model } = await this.call(messages, 0.8, REPLY_MAX_TOKENS);

    if (text) {
      console.log(`[jul-ai] reply via ${model} (${text.length} chars)`);
      return text;
    }

    console.warn('[jul-ai] no reply, using fallback phrase');
    return randomFallback();
  }

  async summarizeConversation(context: SummaryContext): Promise<string> {
    if (!this.apiKey) return 'Had a conversation.';

    const messages = buildSummaryPrompt(context.messages, context.relationship);
    const { text, model } = await this.call(messages, 0.4, SUMMARY_MAX_TOKENS);

    if (text) {
      console.log(`[jul-ai] summary via ${model} (${text.length} chars)`);
      return text;
    }

    return 'Had a conversation.';
  }
}
