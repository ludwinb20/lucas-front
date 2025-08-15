// src/ai/flows/chat-ai-consultation.ts
'use server';

/**
 * @fileOverview AI consultation flow for chat interface.
 *
 * - chatAIConsultation - A function that handles the AI consultation process.
 * - chatAIConsultationStream - A function that handles streaming AI responses.
 * - ChatAIConsultationInput - The input type for the chatAIConsultation function.
 * - ChatAIConsultationOutput - The return type for the chatAIConsultation function.
 */

import { z } from 'zod';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'ai']),
  content: z.string(),
  imageUrl: z.string().optional(),
});

const ChatAIConsultationInputSchema = z.object({
  history: z.array(ChatMessageSchema).describe('Los últimos mensajes del chat, ordenados del más antiguo al más reciente. Máximo 10.'),
});
export type ChatAIConsultationInput = z.infer<typeof ChatAIConsultationInputSchema>;

const ChatAIConsultationOutputSchema = z.object({
  response: z.string().describe('La respuesta generada por la IA.'),
});
export type ChatAIConsultationOutput = z.infer<typeof ChatAIConsultationOutputSchema>;

export async function chatAIConsultation(input: ChatAIConsultationInput): Promise<ChatAIConsultationOutput> {
  try {
    // Llamar al endpoint API interno que maneja la API key de forma segura
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        history: input.history,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      response: data.response,
    };
  } catch (error) {
    console.error('Error calling chat API:', error);
    throw new Error(`Failed to get AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function chatAIConsultationStream(input: ChatAIConsultationInput): Promise<ReadableStream<Uint8Array>> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        history: input.history,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body available for streaming');
    }

    return response.body;
  } catch (error) {
    console.error('Error calling streaming chat API:', error);
    throw new Error(`Failed to get streaming AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
