import { getCollection } from 'astro:content';
import { site } from '../data/site';

export async function getWorks() {
  const works = await getCollection('work', ({ data }) => site.showDrafts || !data.draft);
  return works.sort((a, b) =>
    Number(b.data.featured) - Number(a.data.featured)
    || b.data.date.valueOf() - a.data.date.valueOf()
  );
}
