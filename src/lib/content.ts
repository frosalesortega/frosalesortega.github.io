import { getCollection, type CollectionEntry } from 'astro:content';

export async function getNews(): Promise<CollectionEntry<'news'>[]> {
  const items = await getCollection('news');
  return items.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf() || a.id.localeCompare(b.id));
}
export async function getProjects(): Promise<CollectionEntry<'projects'>[]> {
  return (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
}
export async function getThemes(): Promise<CollectionEntry<'themes'>[]> {
  return (await getCollection('themes')).sort((a, b) => a.data.order - b.data.order);
}
export async function getSoftware(): Promise<CollectionEntry<'software'>[]> {
  return (await getCollection('software')).sort((a, b) => a.data.order - b.data.order);
}
export const isCurrent = (p: CollectionEntry<'projects'>) => p.data.status === 'active';
