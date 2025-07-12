import admin from 'firebase-admin';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

let db: Firestore;
let auth: Auth;
let storage: Storage;

if (!admin.apps.length) {
    if (process.env.NODE_ENV === 'development') {
      // In development, we use the emulators.
      // The Admin SDK needs to be initialized with a project ID,
      // but it doesn't need credentials when talking to emulators.
      process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
      process.env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199';
      process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
      
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });

    } else {
      // In production, we use a service account.
      if (!serviceAccountKey) {
        throw new Error('The Firebase service account key was not found in the environment variables.');
      }
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccountKey)),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    }
}


db = getFirestore();
auth = getAuth();
storage = getStorage();

export { db, auth, storage };
