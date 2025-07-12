// src/app/api/auth/session/route.ts
import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {z} from 'zod';
import {auth as adminAuth} from '@/lib/firebase-admin';

const BodySchema = z.object({
  idToken: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = BodySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({status: 'error', error: 'Invalid request body'}, {status: 400});
    }

    const {idToken} = result.data;
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

    const decodedIdToken = await adminAuth.verifyIdToken(idToken);

    if (new Date().getTime() / 1000 - decodedIdToken.auth_time < 5 * 60) {
      const sessionCookie = await adminAuth.createSessionCookie(idToken, {expiresIn});

      const cookieStore = await cookies();
      cookieStore.set('__session', sessionCookie, {
        maxAge: expiresIn / 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax',
      });

      return NextResponse.json({status: 'success'}, {status: 200});
    } else {
      return NextResponse.json({status: 'error', error: 'Recent sign-in required'}, {status: 401});
    }
  } catch (error) {
    console.error('Failed to create session:', error);
    return NextResponse.json({status: 'error', error: `Failed to create session: ${(error as Error).message}`}, {status: 500});
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
