import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const notes = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    publishedAt: z.string(),
    updatedAt: z.string(),
    category: z.string(),
    tags: z.array(z.string()),
    abstract: z.string(),
    keywords: z.array(z.string()),
  }),
});

export const collections = { notes };
