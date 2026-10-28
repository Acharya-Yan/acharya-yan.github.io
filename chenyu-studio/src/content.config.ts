import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const work = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/work' }),
  schema: z.object({
    title: z.string(), summary: z.string(), date: z.coerce.date(),
    category: z.string(), role: z.string().optional(),
    cover: z.string().optional(), coverAlt: z.string().optional(),
    url: z.url().optional(), draft: z.boolean().default(true),
    featured: z.boolean().default(false),
  }),
});
const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(), summary: z.string(), date: z.coerce.date(),
    category: z.string().default('随记'), draft: z.boolean().default(true),
  }),
});
export const collections = { work, notes };
