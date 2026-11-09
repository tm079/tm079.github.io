// Tách riêng để dùng được cả trong Astro lẫn script Node (scripts/sync-writeups.mjs).

/** "Hack The Box" -> "hack-the-box", "What's NULL" -> "what-s-null", "Đề thi" -> "de-thi" */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
