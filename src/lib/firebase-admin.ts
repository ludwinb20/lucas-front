
import admin from 'firebase-admin';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';

let db: Firestore;
let auth: Auth;
let storage: Storage;

if (!admin.apps.length) {
    // Initialize with service account credentials from .env
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (privateKey && clientEmail && projectId) {
        // Use service account credentials
        const serviceAccount = {
            type: "service_account",
            project_id: projectId,
            private_key: privateKey.replace(/\\n/g, '\n'),
            client_email: clientEmail,
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs"
        };

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
            projectId: projectId,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
    } else {
        // Fallback to default credentials
        admin.initializeApp({
            projectId: projectId,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
    }
}

db = getFirestore();
auth = getAuth();
storage = getStorage();

export { db, auth, storage };
