import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let initialized = false;

export function initFirebaseAdmin() {
  if (initialized) return;

  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (key) {
    const serviceAccount = JSON.parse(key) as ServiceAccount;
    initializeApp({ credential: cert(serviceAccount) });
  } else {
    initializeApp();
  }

  initialized = true;
  console.log('[firebase] admin SDK initialized');
}

export async function verifyToken(token: string) {
  return getAuth().verifyIdToken(token);
}
