import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-freelancers.ts';
import '@/ai/flows/generate-task-description.ts';
import '@/ai/flows/summarize-proposals.ts';