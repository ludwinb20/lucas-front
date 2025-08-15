import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Debug: Verificar todas las cookies recibidas
    const allCookies = request.cookies.getAll();
    const sessionCookie = request.cookies.get('__session');
    
    console.log('🔍 Debug - Todas las cookies recibidas:', allCookies);
    console.log('🔍 Debug - Session cookie encontrada:', !!sessionCookie);
    
    return NextResponse.json({
      authenticated: !!sessionCookie,
      cookies: allCookies.map(cookie => ({
        name: cookie.name,
        hasValue: !!cookie.value,
        valueLength: cookie.value?.length || 0
      })),
      sessionCookie: sessionCookie ? {
        hasValue: !!sessionCookie.value,
        valueLength: sessionCookie.value.length,
        valuePreview: sessionCookie.value.substring(0, 50) + '...'
      } : null
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    return NextResponse.json(
      { error: 'Failed to check authentication status' },
      { status: 500 }
    );
  }
} 