import { create } from 'zustand';
import type { AuraType, SupportedLanguage, UserProfile } from '@spheres/shared';
import {
  getUserProfile,
  createUserProfile,
  updateUserAura,
  updateUserLanguage,
} from '../lib/firestore';

interface UserState {
  profile: UserProfile | null;
  language: SupportedLanguage;
  aura: AuraType;
  coreValue: number;
  loading: boolean;

  loadProfile: (uid: string, email: string) => Promise<void>;
  setAura: (aura: AuraType) => Promise<void>;
  setLanguage: (language: SupportedLanguage) => Promise<void>;
  reset: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  language: 'en',
  aura: 'neutral',
  coreValue: 0,
  loading: false,

  loadProfile: async (uid, email) => {
    set({ loading: true });
    try {
      let profile = await getUserProfile(uid);
      if (!profile) {
        profile = await createUserProfile(uid, email);
      }
      set({
        profile,
        language: profile.language,
        aura: profile.aura,
        coreValue: profile.coreValue,
        loading: false,
      });
    } catch (e) {
      console.error('Failed to load profile:', e);
      set({ loading: false });
    }
  },

  setAura: async (aura) => {
    const { profile } = get();
    set({ aura });
    if (profile) {
      try {
        await updateUserAura(profile.uid, aura);
        set({ profile: { ...profile, aura, updatedAt: Date.now() } });
      } catch (e) {
        console.error('Failed to update aura:', e);
      }
    }
  },

  setLanguage: async (language) => {
    const { profile } = get();
    set({ language });
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    if (profile) {
      try {
        await updateUserLanguage(profile.uid, language);
        set({ profile: { ...profile, language, updatedAt: Date.now() } });
      } catch (e) {
        console.error('Failed to update language:', e);
      }
    }
  },

  reset: () => set({ profile: null, language: 'en', aura: 'neutral', coreValue: 0 }),
}));
