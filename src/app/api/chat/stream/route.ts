import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { history } = body;

    // Formatear mensajes previos como contexto y tomar el último mensaje como la pregunta actual
    const previousMessages = Array.isArray(history) ? history.slice(0, -1) : [];
    const lastMessage = Array.isArray(history) && history.length > 0 ? history[history.length - 1] : null;

    const context = previousMessages
      .map((msg: any) => `${msg.role}: ${msg.content}${msg.imageUrl ? ` [Imagen: ${msg.imageUrl}]` : ''}`)
      .join('\n');

    const currentQuestion = lastMessage?.content || '';

    const prompt = currentQuestion;

    console.log('🔍 Debug - Llamando a MedGemma a través de proxy Next.js');
    console.log('📤 Body enviado (chat/stream):', JSON.stringify({ prompt, context }, null, 2));

    const baseUrl = process.env.NEXT_PUBLIC_MEDGEMMA_API_URL || 'http://137.184.163.232:8000';
    const apiKey = process.env.MEDGEMMA_API_KEY || process.env.NEXT_PUBLIC_MEDGEMMA_API_KEY || process.env.API_KEY || '';

    if (!apiKey) {
      throw new Error('API Key no configurada');
    }

    // Streaming response: reenviar el stream del proveedor como SSE {token, finished}
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('Enviando request a MedGemma (stream):', `${baseUrl}/api/process-text-stream`);

          const upstreamResponse = await fetch(`${baseUrl}/api/process-text-stream`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': apiKey,
            },
            body: JSON.stringify({
              prompt,
              context,
            }),
          });

          console.log('📥 Upstream respuesta (chat/stream) status:', upstreamResponse.status);

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
              const event = { token: text, finished: false };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ finished: true })}\n\n`));
          controller.close();
        } catch (error) {
          console.error('Error en streaming:', error);
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
    console.error('Error in chat stream API route:', error);
    return NextResponse.json(
      { error: `Failed to get AI response: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 