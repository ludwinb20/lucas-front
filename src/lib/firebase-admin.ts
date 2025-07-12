import admin from 'firebase-admin';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

let db: Firestore;
let auth: Auth;
let storage: Storage;

if (!admin.apps.length) {
    if (serviceAccountKey) {
      // In production, we use a service account.
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccountKey)),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } else {
      // In other environments (like local development without a service key),
      // initialize without explicit credentials. It will rely on Application Default Credentials.
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    }
}


db = getFirestore();
auth = getAuth();
storage = getStorage();

export { db, auth, storage };
