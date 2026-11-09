// Kéo write-up từ các repo GitHub khai báo trong `sources` (src/site.config.ts)
// về src/content/synced/, rồi tự thêm frontmatter cho file nào chưa có.
//
// Chạy tự động trước `npm run dev` và `npm run build`. Chạy riêng: `npm run sync`.

import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { SITE } from '../src/site.config.ts';
import { CATEGORY_KEYS } from '../src/lib/taxonomy.ts';
import { slugify } from '../src/lib/slug.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src', 'content', 'synced');
const CACHE = path.join(ROOT, '.cache', 'repos');
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif']);
// Trên GitHub Actions: lỗi là dừng build, tránh deploy một site thiếu bài.
// Trên máy: chỉ cảnh báo, để vẫn chạy được khi mất mạng.
const STRICT = Boolean(process.env.CI);

/** Tên thư mục -> danh mục, dùng khi `categories` trong config không khai báo thư mục đó. */
const CATEGORY_GUESSES = [
  [/web|sql|xss|ssti|ssrf|csrf|lfi|rce|injection|javascript|php/i, 'web'],
  [/pwn|binary|exploit|overflow|heap|rop/i, 'pwn'],
  [/crypt|rsa|aes|xor|hash/i, 'crypto'],
  [/\brev|reverse|crack/i, 'rev'],
  [/forensic|stego|pcap|memory|disk/i, 'forensics'],
  [/osint/i, 'osint'],
  [/machine|boot2root/i, 'boot2root'],
];

const log = (msg) => console.log(`[sync] ${msg}`);
const warn = (msg) => console.warn(`[sync] ⚠ ${msg}`);

function fail(msg) {
  if (STRICT) {
    console.error(`[sync] ✖ ${msg}`);
    process.exit(1);
  }
  warn(`${msg} (bỏ qua, giữ bản đã đồng bộ lần trước nếu có)`);
}

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function walk(dir, base = dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(abs, base));
    else files.push(path.relative(base, abs).split(path.sep).join('/'));
  }
  return files;
}

/** Ngày commit gần nhất của từng file, chỉ cần chạy git log một lần. */
function lastCommitDates(repoDir) {
  const dates = new Map();
  let current = '';
  const out = git(['-c', 'core.quotepath=false', 'log', '--format=@@%cI', '--name-only'], repoDir);
  for (const line of out.split('\n')) {
    if (line.startsWith('@@')) current = line.slice(2).trim();
    else if (line.trim() && !dates.has(line.trim())) dates.set(line.trim(), current);
  }
  return dates;
}

function splitFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { data: {}, body: raw };
  try {
    return { data: YAML.parse(match[1]) ?? {}, body: raw.slice(match[0].length) };
  } catch {
    return { data: {}, body: raw };
  }
}

function guessCategory(...names) {
  for (const name of names) {
    if (!name) continue;
    for (const [re, cat] of CATEGORY_GUESSES) if (re.test(name)) return cat;
  }
  return undefined;
}

const isCategory = (c) => typeof c === 'string' && CATEGORY_KEYS.includes(c);
const isRelative = (p) => !/^([a-z][a-z0-9+.-]*:|#|\/\/)/i.test(p);

/**
 * Sửa đường dẫn ảnh để không làm hỏng build:
 * - Ảnh tương đối có thật trong repo: giữ nguyên (ảnh được copy theo bài).
 * - Ảnh viết dạng "/thu-muc/anh.png" (tính từ gốc repo): đổi thành đường dẫn tương đối.
 * - Ảnh không tìm thấy, hoặc <img> HTML: trỏ thẳng về raw.githubusercontent.com.
 */
function fixImages(body, { rel, repoDir, rawBase }) {
  const mdDir = path.posix.dirname(rel);
  const resolve = (src) => {
    const clean = decodeURIComponent(src.split(/[?#]/)[0]);
    return clean.startsWith('/') ? path.posix.normalize(clean.slice(1)) : path.posix.normalize(path.posix.join(mdDir, clean));
  };
  const toRaw = (target) => `${rawBase}/${target.split('/').map(encodeURIComponent).join('/')}`;

  body = body.replace(/(!\[[^\]]*\]\(\s*)(<[^>]+>|[^)\s]+)/g, (all, prefix, dest) => {
    const src = dest.replace(/^<|>$/g, '');
    if (!isRelative(src)) return all;
    let target;
    try {
      target = resolve(src);
    } catch {
      return all;
    }
    if (target.startsWith('..')) return all;
    if (!existsSync(path.join(repoDir, target))) {
      warn(`${rel}: không thấy ảnh "${src}", dùng link GitHub thay thế`);
      return prefix + toRaw(target);
    }
    if (src.startsWith('/')) {
      const relative = path.posix.relative(mdDir, target);
      return `${prefix}<${relative.startsWith('.') ? relative : `./${relative}`}>`;
    }
    return all;
  });

  body = body.replace(/(<img\b[^>]*?\bsrc=)(["'])([^"']+)\2/gi, (all, prefix, quote, src) => {
    if (!isRelative(src)) return all;
    try {
      return `${prefix}${quote}${toRaw(resolve(src))}${quote}`;
    } catch {
      return all;
    }
  });

  return body;
}

function syncSource(source) {
  const [owner, name] = String(source.repo ?? '').split('/');
  if (!owner || !name) return fail(`"repo" phải có dạng "owner/ten-repo", đang là: ${source.repo}`);

  const repoSlug = slugify(name);
  const repoDir = path.join(CACHE, repoSlug);
  rmSync(repoDir, { recursive: true, force: true });
  mkdirSync(CACHE, { recursive: true });

  try {
    git(['clone', '--quiet', '--filter=blob:none', ...(source.branch ? ['--branch', source.branch] : []), `https://github.com/${source.repo}.git`, repoDir]);
  } catch (err) {
    return fail(`Không clone được ${source.repo}: ${String(err.stderr || err.message).trim()}`);
  }

  const branch = source.branch ?? git(['rev-parse', '--abbrev-ref', 'HEAD'], repoDir).trim();
  const rawBase = `https://raw.githubusercontent.com/${source.repo}/${branch}`;
  const dates = lastCommitDates(repoDir);
  const outDir = path.join(OUT, repoSlug);
  rmSync(outDir, { recursive: true, force: true });

  let posts = 0;
  let images = 0;

  for (const rel of walk(repoDir)) {
    const ext = path.posix.extname(rel).toLowerCase();
    const dest = path.join(outDir, ...rel.split('/'));

    if (IMAGE_EXT.has(ext)) {
      mkdirSync(path.dirname(dest), { recursive: true });
      copyFileSync(path.join(repoDir, rel), dest);
      images++;
      continue;
    }
    if (ext !== '.md') continue;

    const parts = rel.split('/');
    const base = path.posix.basename(rel, path.posix.extname(rel));
    const dirs = parts.slice(0, -1);
    const isReadme = /^(readme|index)$/i.test(base);
    if (isReadme && dirs.length === 0) continue; // README ở gốc repo chỉ là mô tả repo
    if (base.startsWith('_')) continue;

    // "Web/Challenge X/README.md": tên bài = tên thư mục chứa nó
    const groupDirs = isReadme ? dirs.slice(0, -1) : dirs;
    const topFolder = groupDirs[0];

    const raw = readFileSync(path.join(repoDir, rel), 'utf8').replace(/^﻿/, '');
    let { data, body } = splitFrontmatter(raw);

    // Tiêu đề: frontmatter > dòng "# ..." đầu tiên > tên file / tên thư mục
    let title = data.title;
    if (!title) {
      const h1 = body.match(/^\s*#[ \t]+(.+?)[ \t#]*(\r?\n|$)/);
      if (h1) {
        title = h1[1];
        body = body.slice(h1[0].length);
      } else {
        title = isReadme ? dirs.at(-1) : base;
      }
    }

    let category = data.category;
    if (category !== undefined && !isCategory(category)) {
      warn(`${rel}: category "${category}" không hợp lệ (cho phép: ${CATEGORY_KEYS.join(', ')}), tự đoán lại`);
      category = undefined;
    }
    const mapped = topFolder ? source.categories?.[topFolder] : undefined;
    category ??= isCategory(mapped) ? mapped : undefined;
    category ??= guessCategory(...groupDirs, title);
    category ??= isCategory(source.defaultCategory) ? source.defaultCategory : 'misc';

    const frontmatter = {
      ...data,
      title: String(title),
      date: data.date ?? dates.get(rel) ?? new Date().toISOString(),
      platform: data.platform ?? source.platform ?? name,
      ...((data.event ?? source.event) ? { event: data.event ?? source.event } : {}),
      category,
      tags: Array.isArray(data.tags) ? data.tags : groupDirs.map(slugify).filter(Boolean),
      source: `https://github.com/${source.repo}/blob/${branch}/${rel.split('/').map(encodeURIComponent).join('/')}`,
    };

    const outRel = isReadme ? [...dirs, 'index.md'] : parts;
    const outFile = path.join(outDir, ...outRel);
    mkdirSync(path.dirname(outFile), { recursive: true });
    writeFileSync(outFile, `---\n${YAML.stringify(frontmatter)}---\n\n${fixImages(body, { rel, repoDir, rawBase }).trimStart()}`);
    posts++;
  }

  log(`${source.repo} → ${posts} bài, ${images} ảnh`);
  return repoSlug;
}

const sources = SITE.sources ?? [];
const kept = new Set();
for (const source of sources) {
  const slug = syncSource(source);
  if (slug) kept.add(slug);
  else if (source.repo) kept.add(slugify(String(source.repo).split('/')[1] ?? '')); // lỗi: giữ bản cũ
}

// Xoá bài của những repo đã bị bỏ khỏi config
if (existsSync(OUT)) {
  for (const dir of readdirSync(OUT)) {
    if (!kept.has(dir)) rmSync(path.join(OUT, dir), { recursive: true, force: true });
  }
}
if (sources.length === 0) log('Chưa khai báo repo nào trong `sources` (src/site.config.ts).');
