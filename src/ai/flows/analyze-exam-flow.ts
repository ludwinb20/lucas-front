'use server';
/**
 * @fileOverview AI flow for analyzing medical exam images.
 *
 * - analyzeExam - A function that handles the medical image analysis process.
 * - AnalyzeExamInput - The input type for the analyzeExam function.
 * - AnalyzeExamOutput - The return type for the analyzeExam function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeExamInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A medical image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  examType: z.string().describe('The type of the medical exam (e.g., X-Ray, MRI, CT Scan).'),
});
export type AnalyzeExamInput = z.infer<typeof AnalyzeExamInputSchema>;

const AnalyzeExamOutputSchema = z.object({
  summary: z.string().describe('A detailed summary of the analysis in technical medical language, as if written by a radiologist.'),
  findings: z.string().describe('A list of all potential findings, both normal and abnormal, presented clearly.'),
  disclaimer: z.string().describe('A standard disclaimer stating this is an AI analysis and not a substitute for a professional medical diagnosis.'),
});
export type AnalyzeExamOutput = z.infer<typeof AnalyzeExamOutputSchema>;

export async function analyzeExam(input: AnalyzeExamInput): Promise<AnalyzeExamOutput> {
  return analyzeExamFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeExamPrompt',
  input: {schema: AnalyzeExamInputSchema},
  output: {schema: AnalyzeExamOutputSchema},
  prompt: `You are an expert radiologist AI assistant. Your task is to analyze medical images and provide a professional report.

Analyze the following medical image, which is a '{{examType}}'.

Image to analyze: {{media url=imageDataUri}}


Based on the image and exam type, provide the following:
1.  **Summary**: A detailed summary of your analysis in technical, professional medical language. This section should be comprehensive and suitable for another medical professional.
2.  **Findings**: A clear, itemized list of all potential findings. Include both normal and abnormal observations. Structure this in a way that is easy to read.
3.  **Disclaimer**: Provide the following exact disclaimer text: "Importante: Este es un análisis preliminar generado por IA y no debe considerarse un diagnóstico médico definitivo. La interpretación de imágenes médicas es compleja y debe ser realizada por un radiólogo certificado. Consulte a un profesional de la salud para una evaluación completa y un diagnóstico preciso."
`,
});

const analyzeExamFlow = ai.defineFlow(
  {
    name: 'analyzeExamFlow',
    inputSchema: AnalyzeExamInputSchema,
    outputSchema: AnalyzeExamOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
