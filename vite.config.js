import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path for GitLab Pages or other deployment
  base: "/charity-suno",
  // Environment variables configuration
  define: {
    // Allow process.env access in Vite for OpenAI API key and AWS Lambda endpoint
    "process.env": {},
  },
  server: {
    // Development server configuration
    port: 5173,
    strictPort: false,
    cors: true,
    proxy: {
      // Proxy API requests to Lambda during development
      "/api/lambda-ai": {
        target:
          "https://feyfaopxrz25duocz6vohhdlyq0oybff.lambda-url.ap-south-1.on.aws",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/lambda-ai/, ""),
        secure: false,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      },
      "/api/lambda-ssml": {
        target:
          "https://sxst5kcell4xbsveo4qsfitcxe0nvgso.lambda-url.ap-south-1.on.aws",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/lambda-ssml/, ""),
        secure: false,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      },
      "/api/lambda": {
        target:
          "https://eomq47naou5oopejqkm2e3q3ya0mgpyv.lambda-url.ap-south-1.on.aws",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/lambda/, ""),
        secure: false,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      },
    },
  },
  build: {
    // Production build optimization
    outDir: "dist",
    sourcemap: false,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
});
