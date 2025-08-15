'use server';
/**
 * @fileOverview A multi-step AI medical diagnosis flow.
 *
 * - diagnoseSymptoms - A function that handles the conversational diagnosis process.
 * - DiagnoseSymptomInput - The input type for the diagnoseSymptoms function.
 * - DiagnoseSymptomOutput - The return type for the diagnoseSymptoms function.
 */

import { z } from 'zod';
import { medGemmaClient } from '@/lib/medgemma-client';

// Nuevo input estructurado para el doctor
const DiagnoseInputSchema = z.object({
  sintomas: z.string().describe('Síntomas principales del paciente, separados por coma.'),
  signos: z.string().optional().describe('Signos clínicos observados, separados por coma.'),
  hallazgos: z.string().optional().describe('Hallazgos de laboratorio o estudios, separados por coma.'),
  modo: z.enum(['obvios', 'raros']).default('obvios').describe('"obvios" para diagnósticos comunes, "raros" para menos obvios.'),
});
export type DiagnoseInput = z.infer<typeof DiagnoseInputSchema>;

const DiagnoseOutputSchema = z.object({
  diagnósticos: z.array(z.object({
    condición: z.string().describe('Nombre de la condición médica sugerida.'),
    probabilidad: z.number().describe('Probabilidad estimada (0-100)').min(0).max(100),
    justificación: z.string().describe('Breve justificación basada en los datos ingresados.'),
    recomendación: z.string().describe('Recomendación clínica para el doctor.'),
    tipo: z.enum(['obvio', 'raro']).describe('Si el diagnóstico es común (obvio) o menos común (raro).'),
  })).describe('Lista de diagnósticos sugeridos.'),
  disclaimer: z.string().describe('Advertencia sobre el uso clínico de la IA.'),
});
export type DiagnoseOutput = z.infer<typeof DiagnoseOutputSchema>;

export async function diagnoseSymptoms(input: DiagnoseInput): Promise<DiagnoseOutput> {
  try {
    const prompt = `Eres LucasMed, un asistente médico de IA que ayuda a DOCTORES a explorar diagnósticos diferenciales.

Información del caso clínico:
- Síntomas: ${input.sintomas}
- Signos: ${input.signos || 'No especificados'}
- Hallazgos: ${input.hallazgos || 'No especificados'}
- Modo de búsqueda: ${input.modo} (${input.modo === 'obvios' ? 'diagnósticos comunes' : 'diagnósticos menos frecuentes'})

Tu tarea es:
1. Analizar la información y sugerir diagnósticos diferenciales
2. Para cada diagnóstico, indica: condición, probabilidad (0-100), justificación, recomendación, tipo (obvio/raro)
3. Si el modo es "obvios", prioriza diagnósticos comunes. Si es "raros", prioriza diagnósticos atípicos
4. No repitas diagnósticos similares
5. No pidas datos personales ni hables al paciente, solo al doctor
6. Agrega este disclaimer: "Importante: Esta es una sugerencia generada por IA y no reemplaza el juicio clínico profesional. El diagnóstico definitivo y el tratamiento deben ser realizados por un médico."

Proporciona la respuesta en formato JSON con las claves: diagnósticos (array), disclaimer (string).`;

    const response = await medGemmaClient.processText({
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
        diagnósticos: [{
          condición: "Análisis completado",
          probabilidad: 50,
          justificación: "Análisis realizado por IA",
          recomendación: "Consulte a un médico para diagnóstico definitivo",
    tipo: "obvio"
        }],
        disclaimer: "Importante: Esta es una sugerencia generada por IA y no reemplaza el juicio clínico profesional. El diagnóstico definitivo y el tratamiento deben ser realizados por un médico."
      };
    }

    return {
      diagnósticos: parsedResponse.diagnósticos || [],
      disclaimer: parsedResponse.disclaimer || "Importante: Esta es una sugerencia generada por IA y no reemplaza el juicio clínico profesional. El diagnóstico definitivo y el tratamiento deben ser realizados por un médico.",
    };
  } catch (error) {
    console.error('Error calling MedGemma diagnosis:', error);
    throw new Error(`Failed to diagnose symptoms: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
