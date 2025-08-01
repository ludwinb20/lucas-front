// src/ai/flows/chat-ai-consultation.ts
'use server';

/**
 * @fileOverview AI consultation flow for chat interface.
 *
 * - chatAIConsultation - A function that handles the AI consultation process.
 * - ChatAIConsultationInput - The input type for the chatAIConsultation function.
 * - ChatAIConsultationOutput - The return type for the chatAIConsultation function.
 */

import { z } from 'zod';
import { medGemmaClient } from '@/lib/medgemma-client';

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
    // Convertir historial a prompt
    const historyText = input.history
      .map(msg => `${msg.role}: ${msg.content}${msg.imageUrl ? ` [Imagen: ${msg.imageUrl}]` : ''}`)
      .join('\n');

    const prompt = `Eres LucasMed, un asistente médico de IA en un chat con un doctor. Usa el contexto de los últimos mensajes para dar una respuesta precisa y útil.

Historial de mensajes:
${historyText}

Responde al último mensaje del usuario de la forma más útil y profesional posible. Si hay imágenes, tenlas en cuenta en tu análisis.`;

    const response = await medGemmaClient.processText({
      prompt,
      context: historyText,
    });

    if (!response.success) {
      throw new Error('MedGemma API returned unsuccessful response');
    }

    console.log('Total tokens used:', response.tokens_used);

    return {
      response: response.response,
    };
  } catch (error) {
    console.error('Error calling MedGemma chat consultation:', error);
    throw new Error(`Failed to get AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
