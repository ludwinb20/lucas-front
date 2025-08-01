'use server';
/**
 * @fileOverview AI flow for analyzing medical exam images.
 *
 * - analyzeExam - A function that handles the medical image analysis process.
 * - AnalyzeExamInput - The input type for the analyzeExam function.
 * - AnalyzeExamOutput - The return type for the analyzeExam function.
 */

import { z } from 'zod';
import { medGemmaClient } from '@/lib/medgemma-client';

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
  try {
    const prompt = `Eres un radiólogo experto. Analiza esta imagen médica de tipo '${input.examType}' y proporciona:

1. **Resumen**: Un análisis detallado en lenguaje médico técnico y profesional, como si fuera escrito por un radiólogo.
2. **Hallazgos**: Una lista clara y detallada de todos los hallazgos potenciales, tanto normales como anormales.
3. **Disclaimer**: El siguiente texto exacto: "Importante: Este es un análisis preliminar generado por IA y no debe considerarse un diagnóstico médico definitivo. La interpretación de imágenes médicas es compleja y debe ser realizada por un radiólogo certificado. Consulte a un profesional de la salud para una evaluación completa y un diagnóstico preciso."

Proporciona la respuesta en formato JSON con las claves: summary, findings, disclaimer.`;

    const response = await medGemmaClient.processImage({
      imageDataUri: input.imageDataUri,
      prompt,
    });

    if (!response.success) {
      throw new Error('MedGemma API returned unsuccessful response');
    }

    console.log('Total tokens used:', response.tokens_used);

    // Parsear la respuesta JSON
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response.response);
    } catch (parseError) {
      // Si no es JSON válido, crear respuesta estructurada
      parsedResponse = {
        summary: response.response,
        findings: "Análisis completado",
        disclaimer: "Importante: Este es un análisis preliminar generado por IA y no debe considerarse un diagnóstico médico definitivo. La interpretación de imágenes médicas es compleja y debe ser realizada por un radiólogo certificado. Consulte a un profesional de la salud para una evaluación completa y un diagnóstico preciso."
      };
    }

    return {
      summary: parsedResponse.summary || response.response,
      findings: parsedResponse.findings || "Análisis completado",
      disclaimer: parsedResponse.disclaimer || "Importante: Este es un análisis preliminar generado por IA y no debe considerarse un diagnóstico médico definitivo. La interpretación de imágenes médicas es compleja y debe ser realizada por un radiólogo certificado. Consulte a un profesional de la salud para una evaluación completa y un diagnóstico preciso.",
    };
  } catch (error) {
    console.error('Error calling MedGemma exam analysis:', error);
    throw new Error(`Failed to analyze exam: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
