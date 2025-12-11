'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting freelancers based on a task description.
 *
 * The flow takes a task description as input and returns a list of recommended freelancers.
 * The file exports:
 *   - suggestFreelancers: An async function that triggers the flow.
 *   - SuggestFreelancersInput: The input type for the suggestFreelancers function.
 *   - SuggestFreelancersOutput: The output type for the suggestFreelancers function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestFreelancersInputSchema = z.object({
  taskDescription: z
    .string()
    .describe('A detailed description of the task for which freelancers are needed.'),
});
export type SuggestFreelancersInput = z.infer<typeof SuggestFreelancersInputSchema>;

const SuggestFreelancersOutputSchema = z.object({
  freelancerRecommendations: z
    .array(z.string())
    .describe('A list of recommended freelancers based on the task description.'),
});
export type SuggestFreelancersOutput = z.infer<typeof SuggestFreelancersOutputSchema>;

export async function suggestFreelancers(input: SuggestFreelancersInput): Promise<SuggestFreelancersOutput> {
  return suggestFreelancersFlow(input);
}

const suggestFreelancersPrompt = ai.definePrompt({
  name: 'suggestFreelancersPrompt',
  input: {schema: SuggestFreelancersInputSchema},
  output: {schema: SuggestFreelancersOutputSchema},
  prompt: `You are an AI assistant helping clients find suitable freelancers for their tasks.

  Based on the following task description, recommend a list of freelancers who would be a good fit.
  Task Description: {{{taskDescription}}}

  Please provide a list of freelancer names or IDs. Adhere to the output schema, so return a JSON array of strings.
`,
});

const suggestFreelancersFlow = ai.defineFlow(
  {
    name: 'suggestFreelancersFlow',
    inputSchema: SuggestFreelancersInputSchema,
    outputSchema: SuggestFreelancersOutputSchema,
  },
  async input => {
    const {output} = await suggestFreelancersPrompt(input);
    return output!;
  }
);
