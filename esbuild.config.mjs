import esbuild from "esbuild";
import fs from "node:fs";
import process from "node:process";

const production = process.argv[2] === "production";
const packageMetadata = JSON.parse(
  fs.readFileSync(new URL("./package.json", import.meta.url), "utf8")
);

const context = await esbuild.context({
  banner: { js: `// PDF Chat ${packageMetadata.version}\nvar global = globalThis;` },
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian"],
  format: "cjs",
  target: "es2018",
  logLevel: "info",
  sourcemap: production ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
});

if (production) {
  await context.rebuild();
  await context.dispose();
} else {
  await context.watch();
}
