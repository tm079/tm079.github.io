// Danh mục write-up. Muốn thêm danh mục mới (vd: "hardware"),
// thêm một dòng vào CATEGORIES là xong — schema tự cập nhật theo.

export const CATEGORIES = {
  web: { label: 'Web', color: '#5aa9ff' },
  pwn: { label: 'Pwn', color: '#ff6b6b' },
  crypto: { label: 'Crypto', color: '#b48cff' },
  rev: { label: 'Reverse', color: '#2fd4c4' },
  forensics: { label: 'Forensics', color: '#ffb454' },
  osint: { label: 'OSINT', color: '#f78fb3' },
  boot2root: { label: 'Boot2Root', color: '#3ddc97' },
  misc: { label: 'Misc', color: '#9aa5b1' },
} as const;

export type Category = keyof typeof CATEGORIES;

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as [Category, ...Category[]];
