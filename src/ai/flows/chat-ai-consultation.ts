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

const ChatAIConsultationInputSchema = z.object({
  query: z.string().describe('The query from the user.'),
});
export type ChatAIConsultationInput = z.infer<typeof ChatAIConsultationInputSchema>;

const ChatAIConsultationOutputSchema = z.object({
  response: z.string().describe('The AI-powered response to the query.'),
});
export type ChatAIConsultationOutput = z.infer<typeof ChatAIConsultationOutputSchema>;

export async function chatAIConsultation(input: ChatAIConsultationInput): Promise<ChatAIConsultationOutput> {
  return chatAIConsultationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatAIConsultationPrompt',
  input: {schema: ChatAIConsultationInputSchema},
  output: {schema: ChatAIConsultationOutputSchema},
  prompt: `You are an AI assistant in a chat interface.  Respond to the user's query with accurate and helpful information.\n\nQuery: {{{query}}}`,
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
