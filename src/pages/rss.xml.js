import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const notes = (await getCollection('notes'))
    .sort((a, b) => new Date(b.data.publishedAt).getTime() - new Date(a.data.publishedAt).getTime());

  return rss({
    title: "Zhe's Blog",
    description: 'Academic notes on machine learning theory, algorithms, and applications.',
    site: context.site,
    items: notes.map(note => ({
      title: note.data.title,
      pubDate: new Date(note.data.publishedAt),
      description: note.data.abstract,
      link: `/notes/${note.id}`,
      categories: note.data.tags,
    })),
    customData: '<language>en</language>',
  });
}
