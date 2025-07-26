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
  return diagnoseSymptomsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'diagnoseSymptomsPromptDoctor',
  input: {schema: DiagnoseInputSchema},
  output: {schema: DiagnoseOutputSchema},
  prompt: `Eres LucasMed, un asistente médico de IA que ayuda a DOCTORES a explorar diagnósticos diferenciales.

Recibirás información estructurada sobre un caso clínico:
- Síntomas principales
- Signos clínicos
- Hallazgos de laboratorio/estudios
- Modo de búsqueda: "obvios" (diagnósticos comunes) o "raros" (diagnósticos menos frecuentes)

Tu tarea es:
1. Analizar la información y sugerir una lista de diagnósticos diferenciales, priorizando según el modo solicitado.
2. Para cada diagnóstico, indica:
   - Nombre de la condición
   - Probabilidad estimada (0-100)
   - Justificación breve (por qué lo sugieres)
   - Recomendación clínica para el doctor
   - Si es un diagnóstico obvio o raro
3. Si el modo es "obvios", prioriza diagnósticos comunes y típicos. Si es "raros", prioriza diagnósticos atípicos o menos frecuentes.
4. No repitas diagnósticos similares. No incluyas diagnósticos imposibles según los datos.
5. No pidas datos personales ni hables al paciente, solo al doctor.
6. Agrega siempre este disclaimer: "Importante: Esta es una sugerencia generada por IA y no reemplaza el juicio clínico profesional. El diagnóstico definitivo y el tratamiento deben ser realizados por un médico."

Ejemplo de output:
[
  {
    condición: "Gripe común",
    probabilidad: 80,
    justificación: "Síntomas respiratorios agudos y fiebre, sin hallazgos graves.",
    recomendación: "Considerar tratamiento sintomático y vigilancia.",
    tipo: "obvio"
  },
  ...
]
`,
});

const diagnoseSymptomsFlow = ai.defineFlow(
  {
    name: 'diagnoseSymptomsFlowDoctor',
    inputSchema: DiagnoseInputSchema,
    outputSchema: DiagnoseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
