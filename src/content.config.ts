import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORY_KEYS } from './lib/taxonomy';
import { slugify } from './lib/slug';

// Write-up đến từ 2 chỗ:
//  - src/content/writeups/  bài bạn viết thẳng trong repo site này
//  - src/content/synced/    bài kéo từ các repo GitHub trong `sources` (do scripts/sync-writeups.mjs tạo, đừng sửa tay)
// File bắt đầu bằng "_" (vd: _TEMPLATE.md) sẽ bị bỏ qua.
const writeups = defineCollection({
  loader: glob({
    pattern: ['writeups/**/[^_]*.md', 'synced/**/[^_]*.md'],
    base: './src/content',
    // URL = đường dẫn file bỏ thư mục gốc, vd synced/ringzer0ctf/SQL Injection/Login portal 2.md
    //   -> /writeups/ringzer0ctf/sql-injection/login-portal-2/
    generateId: ({ entry, data }) => {
      if (typeof data.slug === 'string') return data.slug;
      return entry
        .replace(/\\/g, '/')
        .replace(/^(writeups|synced)\//, '')
        .replace(/\.md$/i, '')
        .split('/')
        .map(slugify)
        .join('/')
        .replace(/\/index$/, '');
    },
  }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    /** HackTheBox, TryHackMe, CTF, PortSwigger, RootMe… */
    platform: z.string(),
    /** Tên giải CTF (nếu có), vd: "PTITCTF 2026" */
    event: z.string().optional(),
    category: z.enum(CATEGORY_KEYS),
    tags: z.array(z.string()).default([]),
    summary: z.string().optional(),
    /** Link tới file gốc trên GitHub (tự điền cho bài kéo từ repo) */
    source: z.string().optional(),
    /** true = chỉ hiện khi chạy `npm run dev`, không lên site thật */
    draft: z.boolean().default(false),
  }),
});

export const collections = { writeups };
