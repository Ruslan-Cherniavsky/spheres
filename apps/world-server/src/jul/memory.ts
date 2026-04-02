import { getFirestore } from 'firebase-admin/firestore';

export interface UserRelationship {
  trust: number;
  familiarity: number;
  avoidance: number;
  lastInteractionAt: number;
  memorySummary: string;
}

function getDefaultRelationship(): UserRelationship {
  return {
    trust: 0.3,
    familiarity: 0,
    avoidance: 0,
    lastInteractionAt: 0,
    memorySummary: '',
  };
}

export class MemoryManager {
  private cache = new Map<string, UserRelationship>();

  getCachedRelationship(uid: string): UserRelationship | undefined {
    return this.cache.get(uid);
  }

  async getRelationship(uid: string): Promise<UserRelationship> {
    const cached = this.cache.get(uid);
    if (cached) return cached;

    try {
      const db = getFirestore('spheres');
      const doc = await db.collection('jul-memory').doc(uid).get();
      if (doc.exists) {
        const raw = doc.data() ?? {};
        const data: UserRelationship = {
          trust: typeof raw.trust === 'number' ? raw.trust : 0.3,
          familiarity: typeof raw.familiarity === 'number' ? raw.familiarity : 0,
          avoidance: typeof raw.avoidance === 'number' ? raw.avoidance : 0,
          lastInteractionAt: typeof raw.lastInteractionAt === 'number' ? raw.lastInteractionAt : 0,
          memorySummary: typeof raw.memorySummary === 'string' ? raw.memorySummary : '',
        };
        this.cache.set(uid, data);
        return data;
      }
    } catch (err) {
      console.error('[jul] firestore read failed for', uid, (err as Error).message);
    }

    const def = getDefaultRelationship();
    this.cache.set(uid, def);
    return def;
  }

  async saveRelationship(uid: string, rel: UserRelationship): Promise<void> {
    this.cache.set(uid, rel);
    try {
      const db = getFirestore('spheres');
      await db.collection('jul-memory').doc(uid).set(rel);
    } catch (err) {
      console.error('[jul] firestore write failed for', uid, (err as Error).message);
    }
  }

  async updateAfterConversation(
    uid: string,
    conversationWentWell: boolean,
    summary: string,
  ): Promise<void> {
    const rel = await this.getRelationship(uid);

    rel.familiarity = Math.min(1, rel.familiarity + 0.1);
    rel.lastInteractionAt = Date.now();
    rel.memorySummary = summary || rel.memorySummary;

    if (conversationWentWell) {
      rel.trust = Math.min(1, rel.trust + 0.08);
      rel.avoidance = Math.max(0, rel.avoidance - 0.05);
    } else {
      rel.trust = Math.max(0, rel.trust - 0.05);
      rel.avoidance = Math.min(1, rel.avoidance + 0.15);
    }

    await this.saveRelationship(uid, rel);
  }
}
