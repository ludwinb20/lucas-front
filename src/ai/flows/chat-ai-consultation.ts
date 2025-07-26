// src/ai/flows/chat-ai-consultation.ts
'use server';

/**
 * @fileOverview AI consultation flow for chat interface.
 *
 * - chatAIConsultation - A function that handles the AI consultation process.
 * - ChatAIConsultationInput - The input type for the chatAIConsultation function.
 * - ChatAIConsultationOutput - The return type for the chatAIConsultation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  return chatAIConsultationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatAIConsultationPrompt',
  input: {schema: ChatAIConsultationInputSchema},
  output: {schema: ChatAIConsultationOutputSchema},
  prompt: `Eres LucasMed, un asistente médico de IA en un chat con un doctor. Usa el contexto de los últimos mensajes para dar una respuesta precisa y útil.

Historial de mensajes (del más antiguo al más reciente):
{{#each history}}
- {{role}}: {{{content}}}{{#if imageUrl}} [Imagen adjunta: {{imageUrl}}]{{/if}}
{{/each}}

Responde al último mensaje del usuario de la forma más útil y profesional posible. Si hay imágenes, tenlas en cuenta en tu análisis.`,
});

const chatAIConsultationFlow = ai.defineFlow(
  {
    name: 'chatAIConsultationFlow',
    inputSchema: ChatAIConsultationInputSchema,
    outputSchema: ChatAIConsultationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
