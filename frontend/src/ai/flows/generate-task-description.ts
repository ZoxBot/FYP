'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating task descriptions from a short prompt.
 *
 * The flow uses the ai.generate function to generate a more detailed task description.
 * It exports the GenerateTaskDescriptionInput and GenerateTaskDescriptionOutput types,
 * as well as the generateTaskDescription function to be used as a wrapper.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTaskDescriptionInputSchema = z.object({
  prompt: z.string().describe('A short prompt describing the task.'),
});
export type GenerateTaskDescriptionInput = z.infer<typeof GenerateTaskDescriptionInputSchema>;

const GenerateTaskDescriptionOutputSchema = z.object({
  description: z.string().describe('A detailed description of the task.'),
});
export type GenerateTaskDescriptionOutput = z.infer<typeof GenerateTaskDescriptionOutputSchema>;

export async function generateTaskDescription(input: GenerateTaskDescriptionInput): Promise<GenerateTaskDescriptionOutput> {
  return generateTaskDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTaskDescriptionPrompt',
  input: {schema: GenerateTaskDescriptionInputSchema},
  output: {schema: GenerateTaskDescriptionOutputSchema},
  prompt: `You are an expert at writing task descriptions. Based on the short prompt provided, write a detailed and engaging task description.\n\nPrompt: {{{prompt}}}`,
});

const generateTaskDescriptionFlow = ai.defineFlow(
  {
    name: 'generateTaskDescriptionFlow',
    inputSchema: GenerateTaskDescriptionInputSchema,
    outputSchema: GenerateTaskDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
