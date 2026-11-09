const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Ghép đường dẫn với `base` (cần khi deploy vào repo không phải <username>.github.io). */
export function url(path: string): string {
  return `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

export { slugify } from './slug';

export function formatDate(date: Date): string {
  // vd: "21 Oct 2026"
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** plural(1, 'write-up') -> "1 write-up", plural(8, 'write-up') -> "8 write-ups" */
export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

/** Ước lượng thời gian đọc (phút), bỏ qua code block cho sát hơn. */
export function readingTime(body = ''): number {
  const prose = body.replace(/```[\s\S]*?```/g, ' ');
  const words = prose.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
