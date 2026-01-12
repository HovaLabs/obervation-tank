import { defineConfig, loadEnv, ConfigEnv } from "vite";
import reactSwc from "@vitejs/plugin-react-swc";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default ({ mode }: ConfigEnv) => {
  process.env = Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
  const isTest = process.env.NODE_ENV === "test" || process.env.VITEST;

  return defineConfig({
    base: process.env.BASE,
    plugins: [isTest ? react() : reactSwc()],
    build: {
      target: "esnext",
      minify: "esbuild",
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-three": ["three", "@react-three/fiber", "@react-three/drei"],
          },
        },
        treeshake: {
          moduleSideEffects: "no-external",
          propertyReadSideEffects: false,
        },
      },
    },
    esbuild: {
      drop: ["console", "debugger"],
      legalComments: "none",
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true,
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
    },
  });
};
