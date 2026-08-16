// 生成应用图标：纯 Node 渲染 PNG（SDF 抗锯齿）并打包 PNG-in-ICO，零第三方依赖。
// 图形：深蓝圆角方块 + 青色 ">" 提示符 + 白色下划线（终端提示符意象）。
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------- PNG 编码 ----------
const CRC_TABLE = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePng(size, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// ---------- SDF 绘制 ----------
function segDist(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / (abx * abx + aby * aby)));
  return Math.hypot(px - ax - abx * t, py - ay - aby * t);
}
function roundRectDist(px, py, cx, cy, hw, hh, r) {
  const qx = Math.abs(px - cx) - (hw - r);
  const qy = Math.abs(py - cy) - (hh - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

function render(size) {
  const img = Buffer.alloc(size * size * 4);
  const aa = Math.max(1, size / 256);
  const cover = d => Math.max(0, Math.min(1, 0.5 - d / aa));
  const paint = (x, y, r, g, b, a) => {
    if (a <= 0) return;
    const i = (y * size + x) * 4;
    const pa = img[i + 3] / 255;
    const na = a + pa * (1 - a);
    if (na <= 0) return;
    img[i] = Math.round((r * a + img[i] * pa * (1 - a)) / na);
    img[i + 1] = Math.round((g * a + img[i + 1] * pa * (1 - a)) / na);
    img[i + 2] = Math.round((b * a + img[i + 2] * pa * (1 - a)) / na);
    img[i + 3] = Math.round(na * 255);
  };
  const S = size;
  const chevron = [
    [0.3 * S, 0.34 * S, 0.52 * S, 0.5 * S],
    [0.52 * S, 0.5 * S, 0.3 * S, 0.66 * S],
  ];
  const strokeHalf = 0.048 * S;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      paint(x, y, 0x0f, 0x17, 0x2a, cover(roundRectDist(px, py, S / 2, S / 2, S * 0.47, S * 0.47, S * 0.2)));
      const dChevron = Math.min(...chevron.map(([ax, ay, bx, by]) => segDist(px, py, ax, ay, bx, by))) - strokeHalf;
      paint(x, y, 0x2d, 0xd4, 0xbf, cover(dChevron));
      paint(x, y, 0xe2, 0xe8, 0xf0, cover(roundRectDist(px, py, 0.655 * S, 0.66 * S, 0.095 * S, 0.03 * S, 0.02 * S)));
    }
  }
  return img;
}

function ico(pngBuf) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry[0] = 0; // 256 px 记作 0
  entry[1] = 0;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(pngBuf.length, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, pngBuf]);
}

mkdirSync(join(root, 'assets'), { recursive: true });
mkdirSync(join(root, 'build'), { recursive: true });
for (const size of [1024, 256, 64, 32, 16]) {
  writeFileSync(join(root, 'assets', `icon-${size}.png`), encodePng(size, render(size)));
}
writeFileSync(join(root, 'build', 'icon.ico'), ico(encodePng(256, render(256))));
console.log('icons written: assets/icon-{1024,256,64,32,16}.png + build/icon.ico');
