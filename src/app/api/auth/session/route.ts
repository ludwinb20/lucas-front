// src/app/api/auth/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json(
        { error: 'No ID token provided' },
        { status: 400 }
      );
    }

    // Verificar el ID token
    const decodedToken = await auth.verifyIdToken(idToken);

    // Crear session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 días
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    // Configurar la cookie
    const options = {
      maxAge: expiresIn,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
        path: '/',
    };

    const response = NextResponse.json({ success: true });
    response.cookies.set('__session', sessionCookie, options);

    console.log('🔍 Debug - Session cookie creada para usuario:', decodedToken.uid);

    return response;
  } catch (error) {
    console.error('Error creating session cookie:', error);
    return NextResponse.json(
      { error: 'Failed to create session cookie' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('__session');
    return NextResponse.json({status: 'success'}, {status: 200});
  } catch (error) {
    console.error('Failed to delete session:', error);
    return NextResponse.json({status: 'error', error: 'Failed to delete session'}, {status: 500});
  }
}
