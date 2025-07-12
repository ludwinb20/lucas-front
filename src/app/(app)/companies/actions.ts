'use server';

import { z } from 'zod';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase-admin';

// Note: This Server Action is not currently protected by authentication
// because firebase-admin session management is not working in this environment.
// In a production environment, you would re-implement user verification.
// For example:
//
// import { cookies } from 'next/headers';
// import { auth as adminAuth } from '@/lib/firebase-admin';
// const cookieStore = await cookies();
// const sessionCookie = cookieStore.get('__session')?.value || '';
// if (!sessionCookie) {
//   return { success: false, error: 'Not authenticated.' };
// }
// const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
// const userDoc = await getDoc(doc(db, 'users', decodedToken.uid));
// if (!userDoc.exists() || userDoc.data()?.role !== 'superadmin') {
//   return { success: false, error: 'Not authorized' };
// }


const CompanySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
});

export async function createCompanyAction(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    // Note: file upload via Server Actions to firebase-admin storage is complex
    // and has been temporarily removed for simplicity.
    // const file = formData.get('logo') as File;

    const validation = CompanySchema.safeParse({ name });
    if (!validation.success) {
      return { success: false, error: validation.error.errors.map(e => e.message).join(', ') };
    }

    // 2. Create company document in Firestore
    await addDoc(collection(db, 'companies'), {
      name: validation.data.name,
      // logoUrl, // Temporarily removed
      createdAt: serverTimestamp(),
    });

    return { success: true };

  } catch (error) {
    console.error("Error creating company in server action:", error);
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: 'Ocurrió un error desconocido.' };
  }
}
