// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.

import { nodePolyfills } from "vite-plugin-node-polyfills";
import {nitro } from 'nitro/vite'
import {defineConfig} from "vite"
// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  
    plugins: [
      nitro(),
      nodePolyfills({
        include: ["buffer"],
        globals: {
          Buffer: true,
        },
      }),
    ],
    build: {
      rollupOptions: {
        external: ["@bigmi/react", "@mysten/dapp-kit", "@mysten/sui", "@mysten/sui.js"],
      },
    },
    ssr: {
      external: ["@bigmi/react", "@mysten/dapp-kit", "@mysten/sui", "@mysten/sui.js", "@lifi/widget"],
    },
});
