import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile, AuraType, SupportedLanguage } from '@spheres/shared';

const usersRef = (uid: string) => doc(db, 'users', uid);

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(usersRef(uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function createUserProfile(
  uid: string,
  email: string,
): Promise<UserProfile> {
  const profile: UserProfile = {
    uid,
    email,
    language: 'en',
    aura: 'neutral',
    coreValue: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await setDoc(usersRef(uid), profile);
  return profile;
}

export async function updateUserAura(uid: string, aura: AuraType): Promise<void> {
  await updateDoc(usersRef(uid), { aura, updatedAt: Date.now() });
}

export async function updateUserLanguage(
  uid: string,
  language: SupportedLanguage,
): Promise<void> {
  await updateDoc(usersRef(uid), { language, updatedAt: Date.now() });
}
