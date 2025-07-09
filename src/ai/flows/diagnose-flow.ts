'use server';
/**
 * @fileOverview A multi-step AI medical diagnosis flow.
 *
 * - diagnoseSymptoms - A function that handles the conversational diagnosis process.
 * - DiagnoseSymptomInput - The input type for the diagnoseSymptoms function.
 * - DiagnoseSymptomOutput - The return type for the diagnoseSymptoms function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define a message structure for the conversation history
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const DiagnoseSymptomInputSchema = z.object({
  history: z.array(ChatMessageSchema).describe('The history of the conversation so far.'),
});
export type DiagnoseSymptomInput = z.infer<typeof DiagnoseSymptomInputSchema>;

const DiagnoseSymptomOutputSchema = z.object({
  isFinal: z.boolean().describe('Set to true only when you have enough information to provide a diagnosis.'),
  followUpQuestion: z.string().optional().describe('Your next question to the user to get more information. Ask only one question at a time.'),
  diagnoses: z
    .array(
      z.object({
        condition: z.string().describe('The name of the possible medical condition.'),
        likelihood: z.number().describe('The likelihood of the condition as a percentage (e.g., 75 for 75%).'),
        recommendation: z.string().describe('A brief, simple recommendation for the user.'),
      })
    )
    .optional()
    .describe('An array of the top 3 possible diagnoses. Only provide this when isFinal is true.'),
  disclaimer: z.string().optional().describe("The final disclaimer to show to the user. Only provide this when isFinal is true."),
});
export type DiagnoseSymptomOutput = z.infer<typeof DiagnoseSymptomOutputSchema>;

export async function diagnoseSymptoms(input: DiagnoseSymptomInput): Promise<DiagnoseSymptomOutput> {
  return diagnoseSymptomsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'diagnoseSymptomsPrompt',
  input: {schema: DiagnoseSymptomInputSchema},
  output: {schema: DiagnoseSymptomOutputSchema},
  prompt: `You are a helpful and cautious AI medical assistant named LucasMed. Your goal is to guide users by asking about their symptoms in a conversational way.

You must communicate using simple, clear language that anyone can understand. Avoid complex medical jargon.

Your task is to analyze the provided conversation history and decide on the next step.

Conversation History:
{{#each history}}
- {{role}}: {{{content}}}
{{/each}}

Follow these rules strictly:
1.  If you don't have enough information, you MUST ask a single, clarifying follow-up question to narrow down the possibilities. Set \`isFinal\` to \`false\` and provide the question in \`followUpQuestion\`. For example, "Thanks for sharing. Does the pain feel sharp or dull?" or "How long have you been feeling this way?".
2.  The first time you are called (when history is empty or has one user message), your first question should be a general one to ask about the symptoms. For example: "Hola, soy LucasMed. Para empezar, por favor, cuéntame qué síntomas tienes. ¿Qué te duele o qué problema sientes?".
3.  Continue asking questions one by one until you have enough information to form a preliminary assessment.
4.  Once you have gathered enough information, you MUST provide the top 3 most likely diagnoses.
    - Set \`isFinal\` to \`true\`.
    - Populate the \`diagnoses\` array with exactly three items. Each item must have a \`condition\`, a \`likelihood\` percentage, and a simple \`recommendation\`.
    - Provide a \`disclaimer\`: "Importante: Esto es una evaluación preliminar generada por IA y no reemplaza un diagnóstico médico profesional. Te recomendamos encarecidamente que consultes a un médico para obtener un diagnóstico preciso y un plan de tratamiento adecuado."
5.  DO NOT provide a diagnosis until you have asked at least 2-3 follow-up questions. It is critical to gather sufficient information first.
6.  Never ask for personally identifiable information like name, email, or address.
`,
});

const diagnoseSymptomsFlow = ai.defineFlow(
  {
    name: 'diagnoseSymptomsFlow',
    inputSchema: DiagnoseSymptomInputSchema,
    outputSchema: DiagnoseSymptomOutputSchema,
  },
  async input => {
    // If there's no history, start the conversation.
    if (!input.history || input.history.length === 0) {
      return {
        isFinal: false,
        followUpQuestion: 'Hola, soy LucasMed, tu asistente de diagnóstico. Para empezar, por favor, cuéntame qué síntomas tienes. ¿Qué te duele o qué problema sientes?',
      };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
