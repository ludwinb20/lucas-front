'use server';

import { z } from 'zod';
import { auth, db, storage as adminStorage } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';

const CompanySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
});

export async function createCompanyAction(formData: FormData) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('__session')?.value || '';
    if (!sessionCookie) {
      return { success: false, error: 'No autenticado. Por favor, inicia sesión de nuevo.' };
    }
    
    // Verificar el usuario y su rol usando el Admin SDK
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userDoc = await getDoc(doc(db, 'users', decodedToken.uid));
    
    if (!userDoc.exists() || userDoc.data()?.role !== 'superadmin') {
      return { success: false, error: 'No autorizado' };
    }

    const name = formData.get('name') as string;
    const file = formData.get('logo') as File;

    if (!file || !(file instanceof File)) {
        return { success: false, error: 'Logo es requerido.' };
    }

    const validation = CompanySchema.safeParse({ name });
    if (!validation.success) {
      return { success: false, error: validation.error.errors.map(e => e.message).join(', ') };
    }

    // 1. Upload logo to storage using Admin SDK
    const bucket = adminStorage.bucket();
    const filePath = `companies/${Date.now()}_${file.name}`;
    const fileUpload = bucket.file(filePath);
    
    const buffer = Buffer.from(await file.arrayBuffer());
    
    await fileUpload.save(buffer, {
        metadata: {
            contentType: file.type,
        },
    });

    // Make the file public to get a URL
    await fileUpload.makePublic();
    const logoUrl = fileUpload.publicUrl();

    // 2. Create company document in Firestore
    await addDoc(collection(db, 'companies'), {
      name: validation.data.name,
      logoUrl,
      createdAt: serverTimestamp(),
    });

    return { success: true };

  } catch (error) {
    console.error("Error creating company in server action:", error);
    if (error instanceof Error) {
        // Handle specific auth errors
        if ((error as any).code === 'auth/session-cookie-expired') {
            return { success: false, error: 'La sesión ha expirado. Por favor, inicia sesión de nuevo.' };
        }
        return { success: false, error: error.message };
    }
    return { success: false, error: 'Ocurrió un error desconocido.' };
  }
}
