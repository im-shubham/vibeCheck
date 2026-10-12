// Bundles the framework-free widget renderer into public/embed.js (IIFE, minified).
import { build } from "esbuild";

await build({
  entryPoints: ["lib/widget/embed-entry.ts"],
  outfile: "public/embed.js",
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2019"],
  legalComments: "none",
});
console.log("built public/embed.js");
