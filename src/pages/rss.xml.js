import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const mlNotes = await getCollection('notes');
  const embeddedNotes = await getCollection('embedded');

  const allNotes = [...mlNotes, ...embeddedNotes]
    .sort((a, b) => new Date(b.data.publishedAt).getTime() - new Date(a.data.publishedAt).getTime());

  return rss({
    title: "Zhe's Blog",
    description: 'Academic notes on machine learning, embedded systems, and more.',
    site: context.site,
    items: allNotes.map(note => ({
      title: note.data.title,
      pubDate: new Date(note.data.publishedAt),
      description: note.data.abstract,
      link: note.collection === 'embedded' ? `/embedded/${note.data.slug}` : `/ml/${note.data.slug}`,
      categories: note.data.tags,
    })),
    customData: '<language>zh-cn</language>',
  });
}
