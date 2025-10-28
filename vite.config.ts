import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    
    // Add Sentry plugin for production builds only
    mode === 'production' && sentryVitePlugin({
      org: process.env.SENTRY_ORG || "grace-hospitality",
      project: process.env.SENTRY_PROJECT || "grace-widget-browser",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      
      // Upload source maps for better error stack traces
      sourcemaps: {
        assets: "./dist/**",
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['grapesjs', 'grapesjs-preset-newsletter']
  },
  build: {
    // Enable source maps for Sentry
    sourcemap: true,
    
    commonjsOptions: {
      include: [/grapesjs/, /node_modules/]
    }
  }
}));
