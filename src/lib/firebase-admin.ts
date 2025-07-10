import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getStorage as getClientStorage } from 'firebase/storage';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

if (process.env.VERCEL_ENV) {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount!),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }
} else {
  // In a local environment, use the client SDKs with emulator support
  // This avoids needing a service account for local dev
}

const db = admin.apps.length > 0 ? getFirestore() : {} as FirebaseFirestore.Firestore;
const auth = admin.apps.length > 0 ? getAuth() : {} as admin.auth.Auth;
const adminStorage = admin.apps.length > 0 ? getStorage() : {} as admin.storage.Storage;


const clientApp = !getApps().length ? initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}) : getApp();

const storage = getClientStorage(clientApp);


export { db, auth, adminStorage as storage };

    