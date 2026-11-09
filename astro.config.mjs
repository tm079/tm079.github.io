// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Đổi thành https://<username>.github.io
  site: 'https://tm079.github.io',
  // Nếu repo KHÔNG tên là <username>.github.io (ví dụ repo "writeups"),
  // bỏ comment dòng dưới và đặt đúng tên repo:
  // base: '/writeups',

  markdown: {
    shikiConfig: {
      // Hai theme cho code block: giao diện sáng và tối
      themes: { light: 'github-light', dark: 'github-dark-dimmed' },
      defaultColor: false,
      wrap: false,
    },
  },
});
