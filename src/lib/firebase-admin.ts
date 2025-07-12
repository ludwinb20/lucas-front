
import admin from 'firebase-admin';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';

let db: Firestore;
let auth: Auth;
let storage: Storage;

if (!admin.apps.length) {
    // Initialize with Application Default Credentials
    // This is the recommended approach for server environments like App Hosting
    admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
}


db = getFirestore();
auth = getAuth();
storage = getStorage();

export { db, auth, storage };
