// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: "build",
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Big libraries get their own long-lived chunks so app updates keep them cached
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@mui/x-date-pickers") || id.includes("@mui/x-data-grid") || id.includes("@mui/x-tree-view")) return "mui-x";
          if (id.includes("@mui/") || id.includes("@emotion/")) return "mui";
          if (id.includes("@azure/msal")) return "msal";
          if (id.includes("react-big-calendar")) return "calendar";
          if (id.includes("@tinymce/")) return "tinymce";
          if (id.includes("dayjs") || id.includes("i18next") || id.includes("dompurify") || id.includes("lodash")) return "libs";
          if (id.includes("react") || id.includes("redux") || id.includes("scheduler")) return "react";
          return "vendor";
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.ts",
    css: false,
    exclude: ["node_modules", "build", ".claude/**"],
  },
});
