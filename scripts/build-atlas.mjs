// Build sprite atlas from /assets-src/emoji/ into /public/sprites/
// Generates WebP + PNG atlases at 64px and 128px sizes with manifest

import sharp from "sharp";
import fg from "fast-glob";
import fs from "node:fs";
import path from "node:path";

const INPUT_DIR = "assets-src/emoji";
const OUT_DIR = "public/sprites";
const SIZES = [64, 128];

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

/** Simple grid packer: N per row based on sqrt */
function gridLayout(count, size) {
  const perRow = Math.ceil(Math.sqrt(count));
  const cols = perRow;
  const rows = Math.ceil(count / cols);
  return { cols, rows, width: cols * size, height: rows * size };
}

function tagsFromFilename(fp) {
  const base = path.basename(fp).replace(path.extname(fp), "");
  return base.split(/[_\- ]+/).filter(Boolean);
}

async function rasterizeToSize(fp, size) {
  const buf = await sharp(fp)
    .resize(size, size, { 
      fit: "contain", 
      background: { r: 255, g: 255, b: 255, alpha: 0 } 
    })
    .png()
    .toBuffer();
  return buf;
}

async function buildAtlasForSize(files, size) {
  const { cols, rows, width, height } = gridLayout(files.length, size);
  const composites = [];
  const frames = {};

  // Deterministic ordering: by filename
  const sorted = [...files].sort();

  for (let i = 0; i < sorted.length; i++) {
    const fp = sorted[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * size;
    const y = row * size;

    const buf = await rasterizeToSize(fp, size);
    composites.push({ input: buf, left: x, top: y });

    const id = path.basename(fp).replace(path.extname(fp), "");
    frames[id] = frames[id] || { tags: tagsFromFilename(fp), frames: {} };
    frames[id].frames[size] = { x, y, w: size, h: size };
  }

  const sheetPng = sharp({
    create: { 
      width, 
      height, 
      channels: 4, 
      background: { r: 0, g: 0, b: 0, alpha: 0 } 
    }
  }).composite(composites);

  const pngPath = path.join(OUT_DIR, `atlas-${size}.png`);
  const webpPath = path.join(OUT_DIR, `atlas-${size}.webp`);

  await sheetPng.clone().png({ compressionLevel: 9 }).toFile(pngPath);
  await sheetPng.clone().webp({ quality: 90 }).toFile(webpPath);

  return { frames, width, height, cols, rows, size };
}

async function main() {
  const files = await fg([`${INPUT_DIR}/**/*.{svg,png}`], { 
    dot: false, 
    onlyFiles: true 
  });
  
  if (files.length === 0) {
    console.error(`No input sprites found in ${INPUT_DIR}. Add SVG/PNG files first.`);
    process.exit(1);
  }

  console.log(`Found ${files.length} sprites. Building atlases...`);

  const meta = { 
    version: 1, 
    sizes: SIZES, 
    generatedAt: new Date().toISOString() 
  };
  const sprites = {};
  const tagIndex = {};

  for (const size of SIZES) {
    console.log(`Building ${size}px atlas...`);
    const res = await buildAtlasForSize(files, size);
    
    // Merge frames into sprites
    for (const [id, data] of Object.entries(res.frames)) {
      if (!sprites[id]) {
        sprites[id] = { tags: data.tags, frames: {} };
      }
      sprites[id].frames[size] = data.frames[size];
      
      // Build tag index
      for (const tag of data.tags) {
        if (!tagIndex[tag]) tagIndex[tag] = [];
        if (!tagIndex[tag].includes(id)) {
          tagIndex[tag].push(id);
        }
      }
    }
  }

  const manifest = { meta, sprites, tagIndex };
  const manifestPath = path.join(OUT_DIR, "atlas.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  console.log(`✓ Wrote ${Object.keys(sprites).length} sprites to manifest`);
  console.log(`✓ Generated atlases: atlas-64.webp/png, atlas-128.webp/png`);
  console.log(`✓ Manifest: ${manifestPath}`);
}

main().catch(e => {
  console.error("Atlas build failed:", e);
  process.exit(1);
});
