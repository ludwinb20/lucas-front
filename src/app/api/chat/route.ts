import { NextRequest, NextResponse } from 'next/server';
import { medGemmaClient } from '@/lib/medgemma-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { history, stream = false } = body;

    // Construir context con mensajes previos y prompt con las indicaciones + la pregunta actual
    const previousMessages = Array.isArray(history) ? history.slice(0, -1) : [];
    const lastMessage = Array.isArray(history) && history.length > 0 ? history[history.length - 1] : null;

    const context = previousMessages
      .map((msg: any) => `${msg.role}: ${msg.content}${msg.imageUrl ? ` [Imagen: ${msg.imageUrl}]` : ''}`)
      .join('\n');

    const currentQuestion = lastMessage?.content || '';

    const prompt = currentQuestion;

    console.log('🔍 Debug - Llamando a MedGemma desde servidor (API key segura)');
    console.log('📤 Body a enviar (chat route):', JSON.stringify({ prompt, context }, null, 2));

    if (stream) {
      // Reenviar stream real desde el upstream como SSE {token, finished}
      const baseUrl = process.env.NEXT_PUBLIC_MEDGEMMA_API_URL || 'http://137.184.163.232:8000';
      const apiKey = process.env.MEDGEMMA_API_KEY || process.env.NEXT_PUBLIC_MEDGEMMA_API_KEY || process.env.API_KEY || '';

      if (!apiKey) {
        throw new Error('API Key no configurada');
      }
      console.log('🔍 Debug - Llamando a MedGemma desde servidor (API key segura)');
      console.log("Url: ", `${baseUrl}/api/process-text-stream`);
      const upstreamResponse = await fetch(`${baseUrl}/api/process-text-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({ prompt, context }),
      });

      console.log('📥 Upstream respuesta (chat route stream) status:', upstreamResponse.status);

      if (!upstreamResponse.ok) {
        const errorData = await upstreamResponse.json().catch(() => ({}));
        return NextResponse.json(
          { error: errorData.error || `HTTP ${upstreamResponse.status}: ${upstreamResponse.statusText}` },
          { status: upstreamResponse.status }
        );
      }

      const reader = upstreamResponse.body?.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      const passthrough = new ReadableStream({
        async start(controller) {
          try {
            if (!reader) throw new Error('No upstream body');
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
          } catch (err) {
            console.error('Error reenviando stream (chat route):', err);
            controller.close();
          }
        }
      });

      return new Response(passthrough, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    } else {
      // Respuesta no streaming
      const response = await medGemmaClient.processText({
        prompt,
        context,
      });

      if (!response.success) {
        throw new Error('MedGemma API returned unsuccessful response');
      }

      console.log('Total tokens used:', response.tokens_used);
      console.log('📥 Respuesta no-streaming (len):', response.response?.length ?? 0);

      return NextResponse.json({
        response: response.response,
      });
    }
  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { error: `Failed to get AI response: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 