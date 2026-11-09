# Write-up site

Trang tổng hợp write-up CTF, dựng bằng [Astro](https://astro.build) và deploy lên GitHub Pages.

- Tự kéo write-up từ các repo GitHub của bạn, file Markdown không cần sửa gì
- Lọc theo danh mục / nền tảng, tìm kiếm toàn văn (Pagefind)
- Mục lục tự động, nút copy code, tô màu code cho giao diện sáng/tối
- Không gọi GitHub API lúc người xem mở trang → không dính giới hạn request, Google index được

## Chạy trên máy

Cần Node.js **22.23.4** trở lên và `git`.

```bash
npm install
npm run dev        # http://localhost:4321 — tự kéo write-up rồi chạy, sửa file là trang tự reload
```

Tìm kiếm chỉ hoạt động trên bản đã build:

```bash
npm run build
npm run preview
```

## Thêm write-up

### Cách 1 — Từ repo write-up riêng (đang dùng)

Khai báo repo trong `sources` ở `src/site.config.ts`:

```ts
sources: [
  { repo: 'tm079/RingZer0CTF', platform: 'RingZer0CTF', categories: { 'SQL Injection': 'web' } },
  { repo: 'tm079/HackTheBox', platform: 'HackTheBox' },
  { repo: 'tm079/PTITCTF-2026', platform: 'CTF', event: 'PTITCTF 2026' },
],
```

Mỗi lần build, site clone các repo này về và đăng **mọi file `.md`** trong đó. Repo phải để **public**.

**Không cần viết frontmatter**, site tự điền:

| Thông tin | Lấy từ |
| --- | --- |
| Tên bài | Dòng `# Tiêu đề` đầu file nếu có, không thì lấy tên file (`Login portal 2.md` → "Login portal 2") |
| Danh mục | Tên thư mục, theo `categories` trong config. Không khai báo thì đoán theo tên (Web, Crypto, Forensics, Pwn…). Không đoán được thì là `misc` |
| Tag | Tên thư mục (`SQL Injection` → `#sql-injection`) |
| Ngày | Lần commit cuối của file |
| Nền tảng | `platform` trong config (mặc định là tên repo) |

Muốn tự đặt tóm tắt, tag hay ngày cho một bài, thêm frontmatter vào đầu file đó trong repo write-up. Giá trị bạn ghi sẽ được ưu tiên:

```markdown
---
summary: "Union-based SQLi, lấy password hash rồi đăng nhập lại."
tags: [sqli, union]
---
```

Vài quy ước:
- `README.md` ở **gốc** repo bị bỏ qua (đó là mô tả repo).
- Kiểu `Ten-bai/README.md` (mỗi bài một thư mục) cũng được: tên bài lấy theo tên thư mục.
- Ảnh để trong repo và chèn bằng đường dẫn tương đối, vd `![](image.png)`, sẽ được copy theo.
- File tên bắt đầu bằng `_` bị bỏ qua.

> Bài kéo về nằm ở `src/content/synced/`. Thư mục này bị xoá và tạo lại mỗi lần build, **đừng sửa tay**. Muốn sửa bài thì sửa trong repo write-up.

### Cách 2 — Viết thẳng trong repo site

Copy `src/content/writeups/_TEMPLATE.md` thành file mới trong `src/content/writeups/` (vd `hackthebox/ten-machine.md`), điền frontmatter rồi đổi `draft: false`. Cách này hợp cho bài lẻ không thuộc repo nào.

## Khi nào site cập nhật bài mới?

Push vào repo write-up **không** tự làm site build lại ngay. Site được build lại khi:
- bạn push vào repo site này, hoặc
- **mỗi ngày lúc 7h sáng** (giờ Việt Nam), hoặc
- bạn vào tab **Actions** của repo site → **Deploy to GitHub Pages** → **Run workflow** để cập nhật ngay.

GitHub tự tắt lịch chạy hằng ngày nếu repo site không có commit nào trong 60 ngày. Khi đó vào tab Actions bật lại là được.

## Cá nhân hoá

| Muốn đổi | Sửa ở đâu |
| --- | --- |
| Tên, username, bio, tiêu đề trang chủ, link liên hệ, mô tả nền tảng, repo write-up | `src/site.config.ts` |
| Domain của site | `site` trong `astro.config.mjs` |
| Trang About | `src/pages/about.md` |
| Màu sắc, font | Đầu file `src/styles/global.css` |
| Danh mục (web, pwn, crypto…) và màu của chúng | `src/lib/taxonomy.ts` |
| Theme màu code | `shikiConfig` trong `astro.config.mjs` |
| Mặc định sáng hay tối | Script trong `src/layouts/BaseLayout.astro` |

## Deploy lên GitHub Pages

1. Tạo repo trên GitHub tên **`<username>.github.io`** (vd `tm079.github.io`).
2. Kiểm tra `site` trong `astro.config.mjs` là `https://<username>.github.io`.
3. Push code:
   ```bash
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/<username>/<username>.github.io.git
   git push -u origin main
   ```
4. Trên GitHub, vào **Settings → Pages → Build and deployment → Source**, chọn **GitHub Actions**.
5. Từ giờ workflow `.github/workflows/deploy.yml` sẽ tự build và deploy.

Nếu đặt tên repo khác (vd `writeups`), site sẽ nằm ở `https://<username>.github.io/writeups/`. Khi đó bỏ comment dòng `base: '/writeups'` trong `astro.config.mjs`.

## Cấu trúc

```
scripts/sync-writeups.mjs  ← kéo write-up từ các repo trong `sources`
src/
├── content/
│   ├── writeups/          ← bài viết thẳng trong repo này
│   └── synced/            ← bài kéo từ repo khác (tự tạo, không commit)
├── content.config.ts      ← schema frontmatter
├── site.config.ts         ← thông tin cá nhân + danh sách repo write-up
├── lib/                   ← taxonomy, hàm tiện ích
├── components/            ← Header, Footer, thẻ write-up, mục lục…
├── layouts/
├── pages/                 ← trang chủ, /writeups, /platforms, /tags, /search, /about
└── styles/                ← global.css (màu, font), prose.css (nội dung bài)
```
