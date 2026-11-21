import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

export const NEWS_CATEGORIES = ['Talk', 'Interview', 'Media', 'Publication', 'Outreach', 'Science Policy', 'Institutional', 'Award', 'Conference'] as const;

const link = z.object({ label: z.string(), url: z.string() });
const pressItem = z.object({
  date: z.coerce.date(),
  datePrecision: z.enum(['day', 'month', 'year']).optional(),
  outlet: z.string(),
  title: z.string(),
  url: z.string(),
  lang: z.string().optional(),
  kind: z.string().optional(),
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    date: z.coerce.date(),
    datePrecision: z.enum(['day', 'month', 'year']).optional(),
    title: z.string(),
    category: z.enum(NEWS_CATEGORIES),
    summary: z.string(),
    venue: z.string().optional(),
    url: z.string().optional(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    related: z.string().optional(),
    tags: z.array(z.string()).optional(),
    lang: z.string().optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    acronym: z.string(),
    fullName: z.string().optional(),
    role: z.string(),
    period: z.string(),
    status: z.enum(['active', 'completed', 'paused']),
    kind: z.enum(['survey', 'instrument', 'facility', 'database', 'collaboration', 'archival']),
    institutions: z.array(z.string()).default([]),
    pi: z.string().optional(),
    funding: z.string().optional(),
    links: z.array(link).default([]),
    summary: z.string(),
    blurb: z.string().optional(),
    order: z.number(),
    featured: z.boolean().default(false),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    imageFit: z.enum(['cover', 'contain']).default('cover'),
    imageCredit: z.string().optional(),
    bibkeys: z.array(z.string()).optional(),
    press: z.array(pressItem).optional(),
  }),
});

const themes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/themes' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    summary: z.string(),
  }),
});

const software = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/software' }),
  schema: z.object({
    name: z.string(),
    summary: z.string(),
    language: z.string().optional(),
    license: z.string().optional(),
    status: z.string(),
    repo: z.string().optional(),
    docs: z.string().optional(),
    downloads: z.array(link).optional(),
    paper: z.string().optional(),
    project: z.string().optional(),
    order: z.number(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    note: z.string().optional(),
  }),
});

export const collections = { news, projects, themes, software, pages };
