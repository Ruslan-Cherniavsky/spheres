import type { DialogueContext } from './providers/ai-provider.js';
import type { UserRelationship } from './memory.js';
import { JUL_CHARACTER_PROMPT } from './personality.js';

function describeMood(mood: number): string {
  if (mood > 0.8) return 'feeling warm and content';
  if (mood > 0.6) return 'in a calm, gentle mood';
  if (mood > 0.4) return 'feeling a bit contemplative';
  if (mood > 0.2) return 'feeling quiet and withdrawn';
  return 'feeling sad and distant';
}

function buildRelationshipContext(rel: UserRelationship): string {
  const parts: string[] = [];
  if (rel.familiarity > 0.5) parts.push('You know this person fairly well.');
  else if (rel.familiarity > 0.2) parts.push('You have met this person before.');
  else parts.push('This is someone new to you.');

  if (rel.trust > 0.7) parts.push('You trust them and feel comfortable.');
  else if (rel.trust > 0.4) parts.push('You are cautiously open with them.');
  else parts.push('You are still guarded around them.');

  if (rel.memorySummary) parts.push(`Your memory of past interactions: ${rel.memorySummary}`);

  return parts.join(' ');
}

export function buildDialoguePrompt(
  context: DialogueContext,
): Array<{ role: string; content: string }> {
  const moodDesc = describeMood(context.mood);
  const relContext = buildRelationshipContext(context.relationship);

  let systemContent = `${JUL_CHARACTER_PROMPT}\n\nCurrent state: You are ${moodDesc}.`;
  if (context.energy < 0.3) systemContent += ' You feel a bit tired.';

  systemContent += `\n\n${relContext}`;

  if (context.interactionType === 'greeting') {
    systemContent += '\n\nYou are initiating contact with this person. Say a soft, shy greeting. Be natural and brief.';
  } else if (context.interactionType === 'farewell') {
    systemContent += '\n\nYou need to say goodbye now. You are tired or need to fly away. Say farewell naturally and gently.';
  }

  const messages: Array<{ role: string; content: string }> = [
    { role: 'user', content: systemContent },
    { role: 'assistant', content: 'Understood.' },
  ];

  for (const msg of context.recentMessages) {
    messages.push({
      role: msg.role === 'jul' ? 'assistant' : 'user',
      content: msg.text,
    });
  }

  if (context.interactionType === 'greeting') {
    messages.push({ role: 'user', content: '[A new sphere approaches you. Start the conversation.]' });
  } else if (context.interactionType === 'farewell') {
    messages.push({ role: 'user', content: '[You need to say goodbye now.]' });
  } else if (context.userMessage) {
    messages.push({ role: 'user', content: context.userMessage });
  }

  return messages;
}

export function buildSummaryPrompt(
  conversationMessages: Array<{ role: 'jul' | 'user'; text: string }>,
  _relationship: UserRelationship,
): Array<{ role: string; content: string }> {
  const transcript = conversationMessages
    .map((m) => `${m.role === 'jul' ? 'Jul' : 'User'}: ${m.text}`)
    .join('\n');

  return [
    {
      role: 'user',
      content:
        'Summarize this conversation in 2-3 sentences. Focus on: what was discussed, emotional tone, any important details the speaker should remember for future meetings. Be concise.',
    },
    {
      role: 'assistant',
      content: 'Understood. Please share the conversation.',
    },
    {
      role: 'user',
      content: transcript,
    },
  ];
}
