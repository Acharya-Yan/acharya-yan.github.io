import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://acharya-yan.github.io',
  output: 'static',
  devToolbar: { enabled: false },
  trailingSlash: 'always',
  integrations: [react(), sitemap()],
});
