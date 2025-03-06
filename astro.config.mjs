// @ts-check
import { defineConfig } from "astro/config";

import node from "@astrojs/node";

import react from "@astrojs/react";
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  output: "server",

  build: {
    server: "build/server/astro",
  },

  adapter: node({
    mode: "middleware",
  }),

  integrations: [
    react(),
    icon({
      // https://github.com/natemoo-re/astro-icon?tab=readme-ov-file#configinclude
      include: {
        // https://icon-sets.iconify.design/noto-v1/
        "noto-v1": ["e-mail", "love-letter", "fearful-face"],
      },
    }),
  ],

  i18n: {
    defaultLocale: "en",
    locales: ["en", "pt-BR"],
  },

  redirects: {
    "/author/": "/author/story/",
  }
});
