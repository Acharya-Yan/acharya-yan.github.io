import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://chenyu-studio.over-tt.chatgpt.site',
  output: 'static',
  devToolbar: { enabled: false },
  trailingSlash: 'always',
  integrations: [react(), sitemap()],
});
