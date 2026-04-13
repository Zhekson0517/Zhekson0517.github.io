import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const mlNotes = await getCollection('notes');
  const embeddedNotes = await getCollection('embedded');

  const allNotes = [...mlNotes, ...embeddedNotes];

  const index = allNotes.map(note => ({
    title: note.data.title,
    slug: note.data.slug,
    category: note.data.category,
    tags: note.data.tags,
    abstract: note.data.abstract,
    collection: note.collection,
    href: note.collection === 'embedded' ? `/embedded/${note.data.slug}` : `/ml/${note.data.slug}`,
  }));

  return new Response(JSON.stringify(index), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
