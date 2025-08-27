import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { imageDataUri, prompt } = await request.json();

    if (!imageDataUri || !prompt) {
      return NextResponse.json({ error: 'Missing imageDataUri or prompt' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_MEDGEMMA_API_URL || 'http://137.184.163.232:8000';
    const apiKey = process.env.MEDGEMMA_API_KEY || process.env.NEXT_PUBLIC_MEDGEMMA_API_KEY || process.env.API_KEY || '';

    if (!apiKey) {
      throw new Error('API Key no configurada');
    }
    console.log("Url: ", `${baseUrl}/api/process-image-stream`);
    console.log('📤 Body enviado a upstream /api/process-image-stream:', JSON.stringify({ 
      imageDataUri: imageDataUri.substring(0, 100) + '...', 
      prompt 
    }, null, 2));

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const upstreamResponse = await fetch(`${baseUrl}/api/process-image-stream`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': apiKey,
            },
            body: JSON.stringify({
              imageDataUri,
              prompt
            }),
          });

          console.log('📥 Upstream respuesta (process-image-stream) status:', upstreamResponse.status);

          if (!upstreamResponse.ok) {
            const errorData = await upstreamResponse.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${upstreamResponse.status}: ${upstreamResponse.statusText}`);
          }

          if (!upstreamResponse.body) {
            throw new Error('No response body available for upstream streaming');
          }

          const reader = upstreamResponse.body.getReader();
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              const text = decoder.decode(value);
              controller.enqueue(encoder.encode(text));
            }
          }
          // enviar evento de finalización
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ finished: true })}\n\n`));
          controller.close();
        } catch (error) {
          console.error('Error en streaming (process-image-stream):', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('Error in process-image-stream API route:', error);
    return NextResponse.json(
      { error: `Failed to get AI response: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 