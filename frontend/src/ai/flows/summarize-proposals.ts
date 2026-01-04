'use server';

/**
 * @fileOverview This file defines a Genkit flow for summarizing freelancer proposals.
 *
 * - summarizeProposals - A function that takes in an array of freelancer proposals and returns a summarized view of each proposal.
 * - SummarizeProposalsInput - The input type for the summarizeProposals function, which is an array of proposal strings.
 * - SummarizeProposalsOutput - The output type for the summarizeProposals function, which is an array of summarized proposal strings.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeProposalsInputSchema = z.array(z.string().describe('A freelancer proposal.'));
export type SummarizeProposalsInput = z.infer<typeof SummarizeProposalsInputSchema>;

const SummarizeProposalsOutputSchema = z.array(z.string().describe('A summarized freelancer proposal.'));
export type SummarizeProposalsOutput = z.infer<typeof SummarizeProposalsOutputSchema>;

export async function summarizeProposals(proposals: SummarizeProposalsInput): Promise<SummarizeProposalsOutput> {
  return summarizeProposalsFlow(proposals);
}

const summarizeProposalPrompt = ai.definePrompt({
  name: 'summarizeProposalPrompt',
  input: {
    schema: z.object({
      proposal: z.string().describe('A freelancer proposal.'),
    }),
  },
  output: { schema: z.string().describe('A summarized freelancer proposal.') },
  prompt: `Summarize the following freelancer proposal, highlighting key skills and experience. Be concise and focus on the most relevant information for a client to quickly compare candidates:\n\n{{{proposal}}}`,
});

const summarizeProposalsFlow = ai.defineFlow(
  {
    name: 'summarizeProposalsFlow',
    inputSchema: SummarizeProposalsInputSchema,
    outputSchema: SummarizeProposalsOutputSchema,
  },
  async proposals => {
    const summarizedProposals = await Promise.all(
      proposals.map(async proposal => {
        const { output } = await summarizeProposalPrompt({ proposal });
        return output!;
      })
    );
    return summarizedProposals;
  }
);
