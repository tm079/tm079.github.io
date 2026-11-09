// ============================================================
//  Thông tin cá nhân — sửa file này trước tiên.
//  (Nhớ sửa cả `site` trong astro.config.mjs cho khớp username.)
// ============================================================

/** Một repo write-up trên GitHub mà site sẽ tự kéo về khi build. */
export interface WriteupSource {
  /** "owner/ten-repo" — repo phải để public */
  repo: string;
  /** Nhánh cần lấy (mặc định: nhánh chính của repo) */
  branch?: string;
  /** Tên nền tảng hiển thị trên site (mặc định: tên repo) */
  platform?: string;
  /** Tên giải CTF, nếu cả repo là write-up của một giải */
  event?: string;
  /**
   * Tên thư mục -> danh mục, vd { 'SQL Injection': 'web' }.
   * Thư mục không khai báo sẽ được đoán theo tên (Web, Crypto, Forensics, Pwn…).
   */
  categories?: Record<string, string>;
  /** Danh mục khi không đoán được (mặc định: 'misc') */
  defaultCategory?: string;
}

export const SITE = {
  /** Tên site, hiện trên tab trình duyệt: "tm079 - Home", "tm079 - Write-ups"… */
  title: 'tm079',
  /** Tên của bạn */
  author: 'Thai Manh',
  /** Username GitHub — dùng cho logo, link GitHub và avatar */
  username: 'tm079',
  /** Mô tả ngắn cho SEO */
  description: 'CTF write-ups and learning notes by Thai Duy Manh.',
  /** Dòng chữ nhỏ màu xanh phía trên tiêu đề ở trang chủ */
  tagline: '// learning notes & ctf write-ups',
  /** Dòng tiêu đề lớn ở trang chủ — để trống ('') thì không hiện */
  heroTitle: "Hi, I'm Manh.",
  /** Giới thiệu ngắn ở trang chủ */
  bio: 'Information Technology student at PTIT with a passion for security. This page is where I share my CTF write-ups.',
  /** Link liên hệ (hiện ở footer và trang About) */
  socials: [
    { label: 'GitHub', href: 'https://github.com/tm079' },
    { label: 'Email', href: 'mailto:thaimanh0709@gmail.com' },
  ],
  /**
   * Các repo write-up trên GitHub. Mỗi lần build, site clone các repo này và đăng
   * mọi file .md bên trong (trừ README.md ở gốc repo). File không cần frontmatter:
   * tên bài lấy từ tên file, danh mục từ tên thư mục, ngày từ lần commit cuối.
   * Có repo mới thì thêm một dòng vào đây.
   */
  sources: [
    { repo: 'tm079/RingZer0CTF', platform: 'RingZer0CTF', categories: { 'SQL Injection': 'web' } },
  ] as WriteupSource[],
  /**
   * Mô tả cho từng nền tảng (hiện trên thẻ ở trang chủ).
   * Key phải trùng với giá trị `platform` trong frontmatter write-up.
   * Nền tảng nào không có ở đây vẫn hiện bình thường, chỉ là không có mô tả.
   */
  platforms: {
    RingZer0CTF: 'Challenges from RingZer0 Team Online CTF.',
    CTF: "Write-ups from CTF events I've played.",
    HackTheBox: 'Machines and challenges on Hack The Box.',
    TryHackMe: 'Rooms and learning paths on TryHackMe.',
    PortSwigger: 'Web Security Academy labs.',
    CryptoHack: 'Cryptography challenges on CryptoHack.',
  } as Record<string, string>,
};
