/**
 * Rasterizes `public/brand/techivano-mark.svg` to PNG + ICO fallbacks.
 * Run via `pnpm run generate:favicons` or web `prebuild`.
 */
import { readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import pngToIco from "png-to-ico";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svgPath = join(root, "public/brand/techivano-mark.svg");
const publicDir = join(root, "public");

async function main() {
  const svg = await readFile(svgPath);

  const buf32 = await sharp(svg).resize(32, 32).png().toBuffer();
  await writeFile(join(publicDir, "favicon-32x32.png"), buf32);

  const buf180 = await sharp(svg).resize(180, 180).png().toBuffer();
  await writeFile(join(publicDir, "apple-touch-icon.png"), buf180);

  const ico = await pngToIco([buf32]);
  await writeFile(join(publicDir, "favicon.ico"), ico);

  console.warn("generate-favicons: wrote favicon.ico, favicon-32x32.png, apple-touch-icon.png");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
