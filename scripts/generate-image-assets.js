const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(ROOT_DIR, 'image-assets.ts');

const CARTOON_AVATAR_DIR = path.join(ROOT_DIR, '已有资料', '图片资源', '卡通头像');
const TECH_BRAND_HERO_DIR = path.join(ROOT_DIR, '已有资料', '图片资源', '科技Banner');
const FLUID_BACKGROUND_DIR = path.join(ROOT_DIR, '已有资料', '图片资源', '流体背景');
const REAL_AVATAR_DIR = path.join(ROOT_DIR, '已有资料', '图片资源', '真人头像');

const REAL_AVATAR_LIMIT = 16;

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function clamp(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function createCanvas(width, height, background) {
  const pixels = Buffer.alloc(width * height * 4);
  const bg = hexToRgb(background);

  for (let i = 0; i < width * height; i++) {
    const offset = i * 4;
    pixels[offset] = bg.r;
    pixels[offset + 1] = bg.g;
    pixels[offset + 2] = bg.b;
    pixels[offset + 3] = 255;
  }

  return { width, height, pixels };
}

function setPixel(canvas, x, y, color, alpha = 255) {
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
    return;
  }

  const offset = (y * canvas.width + x) * 4;
  const currentAlpha = canvas.pixels[offset + 3] / 255;
  const nextAlpha = alpha / 255;
  const mixedAlpha = nextAlpha + currentAlpha * (1 - nextAlpha);
  const rgb = hexToRgb(color);

  const blend = (src, dst) => {
    if (mixedAlpha === 0) return 0;
    return clamp((src * nextAlpha + dst * currentAlpha * (1 - nextAlpha)) / mixedAlpha);
  };

  canvas.pixels[offset] = blend(rgb.r, canvas.pixels[offset]);
  canvas.pixels[offset + 1] = blend(rgb.g, canvas.pixels[offset + 1]);
  canvas.pixels[offset + 2] = blend(rgb.b, canvas.pixels[offset + 2]);
  canvas.pixels[offset + 3] = clamp(mixedAlpha * 255);
}

function fillRect(canvas, x, y, width, height, color, alpha = 255) {
  for (let iy = y; iy < y + height; iy++) {
    for (let ix = x; ix < x + width; ix++) {
      setPixel(canvas, ix, iy, color, alpha);
    }
  }
}

function fillCircle(canvas, cx, cy, radius, color, alpha = 255) {
  const radiusSq = radius * radius;
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= radiusSq) {
        setPixel(canvas, x, y, color, alpha);
      }
    }
  }
}

function fillRoundedRect(canvas, x, y, width, height, radius, color, alpha = 255) {
  for (let iy = y; iy < y + height; iy++) {
    for (let ix = x; ix < x + width; ix++) {
      const dx = Math.max(radius - (ix - x), 0, radius - (x + width - 1 - ix), 0);
      const dy = Math.max(radius - (iy - y), 0, radius - (y + height - 1 - iy), 0);
      if (dx * dx + dy * dy <= radius * radius || dx === 0 || dy === 0) {
        setPixel(canvas, ix, iy, color, alpha);
      }
    }
  }
}

function fillVerticalGradient(canvas, topColor, bottomColor) {
  const top = hexToRgb(topColor);
  const bottom = hexToRgb(bottomColor);

  for (let y = 0; y < canvas.height; y++) {
    const ratio = y / Math.max(canvas.height - 1, 1);
    const color = {
      r: clamp(top.r + (bottom.r - top.r) * ratio),
      g: clamp(top.g + (bottom.g - top.g) * ratio),
      b: clamp(top.b + (bottom.b - top.b) * ratio),
    };

    for (let x = 0; x < canvas.width; x++) {
      const offset = (y * canvas.width + x) * 4;
      canvas.pixels[offset] = color.r;
      canvas.pixels[offset + 1] = color.g;
      canvas.pixels[offset + 2] = color.b;
      canvas.pixels[offset + 3] = 255;
    }
  }
}

function createCrc32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
}

const CRC32_TABLE = createCrc32Table();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    crc = CRC32_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(data.length, 0);

  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);

  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

function encodePng(canvas) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(canvas.width, 0);
  ihdr.writeUInt32BE(canvas.height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const scanlines = Buffer.alloc((canvas.width * 4 + 1) * canvas.height);
  for (let y = 0; y < canvas.height; y++) {
    const rowStart = y * (canvas.width * 4 + 1);
    scanlines[rowStart] = 0;
    canvas.pixels.copy(scanlines, rowStart + 1, y * canvas.width * 4, (y + 1) * canvas.width * 4);
  }

  const idat = zlib.deflateSync(scanlines);

  return Buffer.concat([
    signature,
    createChunk('IHDR', ihdr),
    createChunk('IDAT', idat),
    createChunk('IEND', Buffer.alloc(0)),
  ]);
}

function writePng(filePath, canvas) {
  fs.writeFileSync(filePath, encodePng(canvas));
}

function generateCartoonAvatar(filePath, palette) {
  const canvas = createCanvas(512, 512, palette.background);
  fillCircle(canvas, 256, 256, 230, palette.halo, 220);
  fillCircle(canvas, 256, 200, 98, palette.skin);
  fillRoundedRect(canvas, 150, 286, 212, 154, 84, palette.shirt);
  fillRoundedRect(canvas, 86, 418, 340, 54, 27, '#ffffff', 44);
  fillCircle(canvas, 216, 190, 11, '#202531');
  fillCircle(canvas, 296, 190, 11, '#202531');
  fillRoundedRect(canvas, 218, 236, 76, 16, 8, '#9f5a4a', 180);
  fillRoundedRect(canvas, 162, 114, 188, 52, 24, palette.hair);
  fillCircle(canvas, 164, 156, 44, palette.hair);
  fillCircle(canvas, 348, 156, 44, palette.hair);
  fillCircle(canvas, 190, 266, 10, '#ffcfbe', 120);
  fillCircle(canvas, 322, 266, 10, '#ffcfbe', 120);
  writePng(filePath, canvas);
}

function generateBanner(filePath, width, height, palette) {
  const canvas = createCanvas(width, height, palette.top);
  fillVerticalGradient(canvas, palette.top, palette.bottom);
  fillCircle(canvas, Math.round(width * 0.17), Math.round(height * 0.24), Math.round(height * 0.16), '#ffffff', 26);
  fillCircle(canvas, Math.round(width * 0.86), Math.round(height * 0.76), Math.round(height * 0.22), '#ffffff', 18);
  fillRoundedRect(canvas, Math.round(width * 0.08), Math.round(height * 0.18), Math.round(width * 0.34), Math.round(height * 0.1), 22, '#ffffff', 42);
  fillRoundedRect(canvas, Math.round(width * 0.08), Math.round(height * 0.34), Math.round(width * 0.48), Math.round(height * 0.16), 28, '#ffffff', 68);
  fillRoundedRect(canvas, Math.round(width * 0.08), Math.round(height * 0.56), Math.round(width * 0.26), Math.round(height * 0.08), 18, '#ffffff', 48);
  fillRoundedRect(canvas, Math.round(width * 0.68), Math.round(height * 0.18), Math.round(width * 0.17), Math.round(height * 0.3), 32, palette.card, 210);
  fillRoundedRect(canvas, Math.round(width * 0.72), Math.round(height * 0.24), Math.round(width * 0.09), Math.round(height * 0.12), 18, '#ffffff', 66);
  fillRoundedRect(canvas, Math.round(width * 0.62), Math.round(height * 0.62), Math.round(width * 0.24), Math.round(height * 0.1), 24, '#ffffff', 60);
  writePng(filePath, canvas);
}

function ensureGeneratedSources() {
  ensureDir(CARTOON_AVATAR_DIR);
  ensureDir(TECH_BRAND_HERO_DIR);
  ensureDir(FLUID_BACKGROUND_DIR);
  ensureDir(REAL_AVATAR_DIR);
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') {
    return 'image/png';
  }
  if (ext === '.webp') {
    return 'image/webp';
  }
  return 'image/jpeg';
}

function encodeFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  return {
    name: path.basename(filePath),
    mimeType: getMimeType(filePath),
    base64: buffer.toString('base64'),
  };
}

function readImageFiles(dirPath, limit) {
  const files = fs
    .readdirSync(dirPath)
    .filter((name) => /\.(png|jpe?g|webp)$/i.test(name))
    .sort((a, b) => a.localeCompare(b, 'en'))
    .slice(0, limit);

  return files.map((name) => encodeFile(path.join(dirPath, name)));
}

function buildModuleSource(assets) {
  return `// This file is auto-generated by scripts/generate-image-assets.js
// Do not edit manually.

interface PackedImageAsset {
  name: string;
  mimeType: string;
  base64: string;
}

interface PackedImageAssetMap {
  avatarReal: PackedImageAsset[];
  avatarCartoon: PackedImageAsset[];
  techBrandHero: PackedImageAsset[];
  fluidBackground: PackedImageAsset[];
}

const PACKED_IMAGE_ASSETS: PackedImageAssetMap = ${JSON.stringify(assets, null, 2)};
`;
}

function main() {
  ensureGeneratedSources();

  const avatarReal = readImageFiles(REAL_AVATAR_DIR, REAL_AVATAR_LIMIT);
  const avatarCartoon = readImageFiles(CARTOON_AVATAR_DIR);
  const techBrandHero = readImageFiles(TECH_BRAND_HERO_DIR);
  const fluidBackground = readImageFiles(FLUID_BACKGROUND_DIR);

  const source = buildModuleSource({ avatarReal, avatarCartoon, techBrandHero, fluidBackground });
  fs.writeFileSync(OUTPUT_FILE, source, 'utf8');

  console.log(
    `Generated ${path.relative(ROOT_DIR, OUTPUT_FILE)} with ${avatarCartoon.length} cartoon avatars, ${techBrandHero.length} tech hero images, ${fluidBackground.length} fluid backgrounds and ${avatarReal.length} real avatars.`
  );
}

main();
