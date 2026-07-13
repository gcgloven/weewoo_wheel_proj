#!/usr/bin/env node
/**
 * Generate sized PNG icons from a master icon PNG using sharp.
 * WXT expects bare numeric names (16.png, 32.png, etc.) for manifest auto-detection.
 * Run: node scripts/generate-icons.mjs
 */
import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICON_PATH = resolve(__dirname, '../public/icon/icon.png');
const OUT_DIR = resolve(__dirname, '../public/icon');

mkdirSync(OUT_DIR, { recursive: true });

const sizes = [16, 32, 48, 96, 128];

for (const size of sizes) {
  await sharp(ICON_PATH)
    .resize(size, size)
    .png()
    .toFile(resolve(OUT_DIR, `${size}.png`));
  console.log(`  ✓ ${size}.png`);
}

console.log('Done — all icons generated.');
