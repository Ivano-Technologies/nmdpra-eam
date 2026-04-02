/**
 * Generates placeholder PNGs for the landing page showcase.
 * Replace these files with real captures from the running app when ready.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");

async function main() {
  const sharp = (await import("sharp")).default;
  const bg = { r: 17, g: 24, b: 39 };
  const w = 1200;
  const h = 675;
  const names = ["dashboard-overview", "risk-overview", "reports"];

  await mkdir(publicDir, { recursive: true });

  for (const name of names) {
    const label = name.replace(/-/g, " ");
    const svg = `
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="rgb(${bg.r},${bg.g},${bg.b})"/>
  <text x="50%" y="48%" text-anchor="middle" fill="#d4af37" font-family="system-ui,sans-serif" font-size="28" font-weight="600">RMLIS</text>
  <text x="50%" y="56%" text-anchor="middle" fill="#9ca3af" font-family="system-ui,sans-serif" font-size="16">${label}</text>
  <text x="50%" y="62%" text-anchor="middle" fill="#6b7280" font-family="system-ui,sans-serif" font-size="13">Replace with app screenshot</text>
</svg>`;
    const buf = await sharp(Buffer.from(svg)).png().toBuffer();
    const out = path.join(publicDir, `${name}.png`);
    await writeFile(out, buf);
    console.log("Wrote", out);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
