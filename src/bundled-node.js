/**
 * 本应用目录下的官方便携 Node+npm（不写入系统 PATH）。
 * 系统已有合格 Node 时不会用到；没有时由用户确认后下载。
 */
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import { app } from 'electron';
import { t } from './i18n.js';

/** 满足官方 `^22.19 || >=24` 的钉扎版本；升级时改这一处。 */
export const BUNDLED_NODE_VERSION = '24.18.1';

/** win32 用官方 zip（node.exe 平铺），darwin 用官方 tar.gz（bin/ 布局）；SHASUMS256.txt 两平台同一份。 */
const ARCHIVE =
  process.platform === 'win32'
    ? `node-v${BUNDLED_NODE_VERSION}-win-x64.zip`
    : `node-v${BUNDLED_NODE_VERSION}-darwin-${process.arch}.tar.gz`;
const ALLOWED_HOSTS = new Set(['nodejs.org', 'npmmirror.com', 'cdn.npmmirror.com']);
const ZIP_URLS = [
  `https://nodejs.org/dist/v${BUNDLED_NODE_VERSION}/${ARCHIVE}`,
  `https://npmmirror.com/mirrors/node/v${BUNDLED_NODE_VERSION}/${ARCHIVE}`,
];
const SUM_URLS = [
  `https://nodejs.org/dist/v${BUNDLED_NODE_VERSION}/SHASUMS256.txt`,
  `https://npmmirror.com/mirrors/node/v${BUNDLED_NODE_VERSION}/SHASUMS256.txt`,
];

/** @returns {string} userData（如 `DSH Desktop`）下的 bundled-node 目录。 */
export function bundledNodeRoot() {
  return path.join(app.getPath('userData'), 'bundled-node');
}

/**
 * @param {string} dir 目录。
 * @returns {null | {node: string, npm: string, home: string}} 找到的 node/npm；home 指向装可执行文件的目录（用于前置 PATH）。
 */
function findNodeInDir(dir) {
  if (!dir || !fs.existsSync(dir)) return null;
  const nodeName = process.platform === 'win32' ? 'node.exe' : 'node';
  const npmName = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  // Windows zip 把 node.exe 平铺在解压根；darwin tar.gz 放在 bin/ 下。两种布局都探，home 取实际所在目录。
  const probe = base => {
    for (const home of [base, path.join(base, 'bin')]) {
      const node = path.join(home, nodeName);
      const npm = path.join(home, npmName);
      if (fs.existsSync(node) && fs.existsSync(npm)) return { node, npm, home };
    }
    return null;
  };
  const direct = probe(dir);
  if (direct) return direct;
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const found = probe(path.join(dir, entry.name));
    if (found) return found;
  }
  return null;
}

/** @returns {null | {node: string, npm: string, home: string}} 已落下的便携 Node。 */
export function findBundledRuntime() {
  return findNodeInDir(bundledNodeRoot());
}

/**
 * @param {string} url
 * @param {string} dest
 * @param {(got: number, total: number) => void} [onProgress]
 * @returns {Promise<void>}
 */
function downloadFile(url, dest, onProgress) {
  return new Promise((resolve, reject) => {
    const go = (current, hops) => {
      if (hops > 5) {
        reject(new Error('too many redirects'));
        return;
      }
      let parsed;
      try {
        parsed = new URL(current);
      } catch (error) {
        reject(error);
        return;
      }
      if (!ALLOWED_HOSTS.has(parsed.hostname)) {
        reject(new Error(`unexpected host ${parsed.hostname}`));
        return;
      }
      const lib = parsed.protocol === 'https:' ? https : http;
      const req = lib.get(
        current,
        { headers: { 'User-Agent': 'dsh-desktop-shell' } },
        res => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.resume();
            go(new URL(res.headers.location, current).href, hops + 1);
            return;
          }
          if (res.statusCode !== 200) {
            res.resume();
            reject(new Error(`HTTP ${res.statusCode} for ${parsed.hostname}`));
            return;
          }
          const total = Number(res.headers['content-length'] || 0);
          let got = 0;
          const file = fs.createWriteStream(dest);
          res.on('data', chunk => {
            got += chunk.length;
            if (total > 0) onProgress?.(got, total);
          });
          res.pipe(file);
          file.on('finish', () => {
            file.close(error => {
              if (error) reject(error);
              else resolve();
            });
          });
          file.on('error', reject);
        },
      );
      req.on('error', reject);
    };
    go(url, 0);
  });
}

/**
 * @param {string} url
 * @returns {Promise<string>}
 */
function downloadText(url) {
  return new Promise((resolve, reject) => {
    const go = (current, hops) => {
      if (hops > 5) {
        reject(new Error('too many redirects'));
        return;
      }
      let parsed;
      try {
        parsed = new URL(current);
      } catch (error) {
        reject(error);
        return;
      }
      if (!ALLOWED_HOSTS.has(parsed.hostname)) {
        reject(new Error(`unexpected host ${parsed.hostname}`));
        return;
      }
      const lib = parsed.protocol === 'https:' ? https : http;
      const req = lib.get(current, { headers: { 'User-Agent': 'dsh-desktop-shell' } }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          go(new URL(res.headers.location, current).href, hops + 1);
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        res.on('error', reject);
      });
      req.on('error', reject);
    };
    go(url, 0);
  });
}

/** @param {string} file */
async function sha256File(file) {
  const hash = crypto.createHash('sha256');
  const stream = fs.createReadStream(file);
  for await (const chunk of stream) hash.update(chunk);
  return hash.digest('hex');
}

/** @param {string} text @param {string} filename */
function hashFromSums(text, filename) {
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([0-9a-f]{64})\s+\*?(\S+)\s*$/i);
    if (match && match[2] === filename) return match[1].toLowerCase();
  }
  return '';
}

/**
 * 若便携 Node 已可用则直接返回；否则下载官方归档、校验 SHA-256、解压到本应用目录。
 * @param {{onLog?: (line: string) => void}} [options]
 * @returns {Promise<{ok: true, node: string, npm: string, home: string} | {ok: false, error: string}>}
 */
export async function ensureBundledNode(options = {}) {
  const log = line => options.onLog?.(line);
  if (process.platform !== 'win32' && process.platform !== 'darwin') {
    return { ok: false, error: t('bundledUnsupported') };
  }
  const existing = findBundledRuntime();
  if (existing) {
    log(t('bundledAlready', { home: existing.home }));
    return { ok: true, ...existing };
  }

  const root = bundledNodeRoot();
  const downloadDir = path.join(root, 'download');
  fs.mkdirSync(downloadDir, { recursive: true });
  const archivePath = path.join(downloadDir, ARCHIVE);
  log(t('bundledDownloading', { version: BUNDLED_NODE_VERSION }));

  let downloaded = false;
  let lastError = '';
  for (const url of ZIP_URLS) {
    try {
      log(url);
      let lastPct = -1;
      await downloadFile(url, archivePath, (got, total) => {
        const pct = Math.floor((got / total) * 10) * 10;
        if (pct !== lastPct) {
          lastPct = pct;
          log(t('bundledProgress', { pct, mb: (got / 1e6).toFixed(1), totalMb: (total / 1e6).toFixed(1) }));
        }
      });
      downloaded = true;
      break;
    } catch (error) {
      lastError = String(error);
      log(lastError);
    }
  }
  if (!downloaded) {
    return { ok: false, error: t('bundledDownloadFail', { error: lastError }) };
  }

  let expected = '';
  for (const url of SUM_URLS) {
    try {
      expected = hashFromSums(await downloadText(url), ARCHIVE);
      if (expected) break;
    } catch (error) {
      log(String(error));
    }
  }
  if (!expected) {
    return { ok: false, error: t('bundledSumFail') };
  }
  const actual = await sha256File(archivePath);
  if (actual !== expected) {
    try {
      fs.unlinkSync(archivePath);
    } catch {
      /* 校验失败后尽量删掉坏包，删不掉也不继续解压 */
    }
    return { ok: false, error: t('bundledHashFail') };
  }
  log(t('bundledVerified'));

  log(t('bundledExtracting'));
  // Windows 10+ 自带的 bsdtar 解 zip，macOS 的 bsdtar 解 tar.gz——同一条命令两平台通用。
  const extract = spawnSync('tar', ['-xf', archivePath, '-C', root], {
    windowsHide: true,
    encoding: 'utf8',
  });
  if (extract.status !== 0) {
    return { ok: false, error: t('bundledExtractFail', { error: extract.stderr || extract.stdout || String(extract.status) }) };
  }
  const found = findBundledRuntime();
  if (!found) {
    return { ok: false, error: t('bundledMissingExe') };
  }
  try {
    fs.unlinkSync(archivePath);
  } catch {
    /* 压缩包残留只占空间，不影响使用 */
  }
  log(t('bundledReady', { home: found.home }));
  return { ok: true, ...found };
}
