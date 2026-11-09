import { getCollection, type CollectionEntry } from 'astro:content';
import { slugify } from './utils';

export type Writeup = CollectionEntry<'writeups'>;

/** Tất cả write-up, mới nhất trước. Bài `draft: true` chỉ hiện khi chạy dev. */
export async function getWriteups(): Promise<Writeup[]> {
  const all = await getCollection('writeups', ({ data }) => import.meta.env.DEV || !data.draft);
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export interface PlatformGroup {
  name: string;
  slug: string;
  writeups: Writeup[];
  latest: Date;
}

export function groupByPlatform(writeups: Writeup[]): PlatformGroup[] {
  const map = new Map<string, PlatformGroup>();
  for (const w of writeups) {
    const slug = slugify(w.data.platform);
    const group = map.get(slug) ?? { name: w.data.platform, slug, writeups: [], latest: w.data.date };
    group.writeups.push(w);
    if (w.data.date > group.latest) group.latest = w.data.date;
    map.set(slug, group);
  }
  return [...map.values()].sort((a, b) => b.writeups.length - a.writeups.length || b.latest.valueOf() - a.latest.valueOf());
}

export interface TagGroup {
  name: string;
  slug: string;
  writeups: Writeup[];
}

export function groupByTag(writeups: Writeup[]): TagGroup[] {
  const map = new Map<string, TagGroup>();
  for (const w of writeups) {
    for (const tag of w.data.tags) {
      const slug = slugify(tag);
      const group = map.get(slug) ?? { name: tag, slug, writeups: [] };
      group.writeups.push(w);
      map.set(slug, group);
    }
  }
  return [...map.values()].sort((a, b) => b.writeups.length - a.writeups.length || a.name.localeCompare(b.name));
}

export function countBy<T extends string>(writeups: Writeup[], pick: (w: Writeup) => T | undefined): Map<T, number> {
  const counts = new Map<T, number>();
  for (const w of writeups) {
    const key = pick(w);
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}
