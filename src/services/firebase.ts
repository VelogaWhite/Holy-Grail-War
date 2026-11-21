import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

let authPromise: Promise<User> | null = null;

/**
 * Ensures the browser session has an active Firebase Anonymous Auth user.
 * Safe to call multiple times; caches the in-flight auth promise.
 */
export function ensureAnonymousAuth(): Promise<User> {
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser);
  }
  if (authPromise) {
    return authPromise;
  }

  authPromise = new Promise<User>((resolve, reject) => {
    const unsub = onAuthStateChanged(
      auth,
      async (user) => {
        unsub();
        if (user) {
          resolve(user);
          return;
        }
        try {
          const cred = await signInAnonymously(auth);
          resolve(cred.user);
        } catch (err) {
          authPromise = null;
          reject(err);
        }
      },
      (err) => {
        unsub();
        authPromise = null;
        reject(err);
      }
    );
  });

  return authPromise;
}
