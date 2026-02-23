import { create } from 'zustand';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendEmailVerification,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  init: () => () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  sendVerification: () => Promise<void>;
  reloadUser: () => Promise<void>;
  clearError: () => void;
}

const googleProvider = new GoogleAuthProvider();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  error: null,
  initialized: false,

  init: () => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      set({ user, loading: false, initialized: true });
    });
    return unsubscribe;
  },

  signIn: async (email, password) => {
    set({ error: null, loading: true });
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: unknown) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  signUp: async (email, password) => {
    set({ error: null, loading: true });
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(cred.user);
    } catch (e: unknown) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  signInWithGoogle: async () => {
    set({ error: null, loading: true });
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e: unknown) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  signOut: async () => {
    await firebaseSignOut(auth);
    set({ user: null });
  },

  sendVerification: async () => {
    const { user } = get();
    if (user && !user.emailVerified) {
      await sendEmailVerification(user);
    }
  },

  reloadUser: async () => {
    const { user } = get();
    if (user) {
      await user.reload();
      set({ user: auth.currentUser });
    }
  },

  clearError: () => set({ error: null }),
}));
