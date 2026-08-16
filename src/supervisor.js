/**
 * 后端进程监督器。与 dsh 的全部耦合面：
 *   1. spawn `<command> <args>`（未显式给 --port 时追加 `--port 0`，端口由 OS 分配）；
 *   2. 就绪信号 = stdout 出现 `dsh web: <URL>` 行（dsh 在 Loader 树结算后才打印）；
 *   3. 结束 = taskkill 整棵进程树。
 * 崩溃自动重启（1s/3s/10s 退避，就绪稳定 60s 后清零计数），日志入内存环形缓冲并落盘。
 */
import { spawn, spawnSync } from 'node:child_process';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const READY_PREFIX = 'dsh web: ';
const BACKOFF_MS = [1000, 3000, 10000];
const MAX_LOG_LINES = 1000;
const LOG_ROTATE_BYTES = 5 * 1024 * 1024;

export class Supervisor extends EventEmitter {
  /**
   * @param {{command: string, args: string[], cwd: string, env: Record<string, string>, shell: boolean}} config 后端启动配置。
   * @param {string} logDir 后端日志目录（不存在时创建）。
   */
  constructor(config, logDir) {
    super();
    this.config = config;
    this.state = 'idle';
    this.url = null;
    this.attempts = 0;
    this.lines = [];
    this.child = null;
    this.userStopped = false;
    this.restartTimer = null;
    this.stableTimer = null;
    this.logFile = path.join(logDir, 'backend.log');
    fs.mkdirSync(logDir, { recursive: true });
    try {
      if (fs.existsSync(this.logFile) && fs.statSync(this.logFile).size > LOG_ROTATE_BYTES) {
        fs.renameSync(this.logFile, `${this.logFile}.old`);
      }
    } catch {
      /* 日志轮转失败只影响旧日志保留，不阻塞启动 */
    }
  }

  /**
   * 当前状态快照，供启动页首帧渲染。
   * @returns {{state: string, url: string | null, attempts: number, lines: string[]}} 状态、就绪 URL、重启计数与日志缓冲。
   */
  snapshot() {
    return { state: this.state, url: this.url, attempts: this.attempts, lines: [...this.lines] };
  }

  /** @param {string} line 追加一行日志：缓冲、落盘并广播。 */
  log(line) {
    const stamped = `[${new Date().toLocaleTimeString('zh-CN', { hour12: false })}] ${line}`;
    this.lines.push(stamped);
    if (this.lines.length > MAX_LOG_LINES) this.lines.splice(0, this.lines.length - MAX_LOG_LINES);
    fs.appendFile(this.logFile, `${stamped}\n`, () => {});
    this.emit('log', stamped);
  }

  /**
   * @param {string} state 新状态。
   * @param {Record<string, unknown>} [extra] 附加到 status 事件的字段（如 delayMs）。
   */
  setState(state, extra = {}) {
    this.state = state;
    this.emit('status', { state, url: this.url, attempts: this.attempts, ...extra });
  }

  /** 启动后端进程；已在运行则不重复启动。 */
  start() {
    if (this.child !== null) return;
    this.userStopped = false;
    this.url = null;
    this.setState('starting');
    const args = [...this.config.args];
    if (!args.includes('--port')) args.push('--port', '0');
    this.log(`$ ${this.config.command} ${args.join(' ')}`);
    let child;
    try {
      child = spawn(this.config.command, args, {
        cwd: this.config.cwd || undefined,
        env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0', ...this.config.env },
        shell: this.config.shell === true,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (error) {
      this.log(`启动失败：${String(error)}`);
      this.scheduleRestart();
      return;
    }
    this.child = child;
    child.on('error', error => this.log(`进程错误：${String(error)}`));
    for (const stream of [child.stdout, child.stderr]) {
      if (stream) readline.createInterface({ input: stream }).on('line', line => this.onLine(line));
    }
    child.on('exit', (code, signal) => {
      this.child = null;
      clearTimeout(this.stableTimer);
      this.log(`后端进程退出（code=${code ?? 'null'} signal=${signal ?? 'null'}）`);
      if (this.userStopped) {
        this.setState('stopped');
        return;
      }
      this.scheduleRestart();
    });
  }

  /** @param {string} line 处理一行后端输出：记日志并识别就绪 URL 行。 */
  onLine(line) {
    this.log(line);
    const trimmed = line.trim();
    if (this.url === null && trimmed.startsWith(READY_PREFIX)) {
      const url = trimmed.slice(READY_PREFIX.length).split(/\s/)[0];
      this.url = url;
      this.setState('ready');
      this.emit('ready', url);
      this.stableTimer = setTimeout(() => {
        this.attempts = 0;
      }, 60000);
    }
  }

  /** 按退避表安排自动重启；超过上限则进入 failed 并等待人工重启。 */
  scheduleRestart() {
    if (this.attempts >= BACKOFF_MS.length) {
      this.setState('failed');
      return;
    }
    const delay = BACKOFF_MS[this.attempts];
    this.attempts += 1;
    this.setState('restarting', { delayMs: delay });
    this.log(`${delay / 1000}s 后自动重启（第 ${this.attempts}/${BACKOFF_MS.length} 次）`);
    this.restartTimer = setTimeout(() => this.start(), delay);
  }

  /** 人工重启：清零退避计数，结束现有进程后拉起新进程。 */
  restart() {
    clearTimeout(this.restartTimer);
    this.attempts = 0;
    if (this.child !== null) {
      this.userStopped = true;
      this.child.once('exit', () => {
        setTimeout(() => this.start(), 200);
      });
      this.killTree(this.child.pid);
    } else {
      this.start();
    }
  }

  /** 停止后端且不再自动重启（应用退出路径）。 */
  stop() {
    this.userStopped = true;
    clearTimeout(this.restartTimer);
    clearTimeout(this.stableTimer);
    if (this.child !== null) this.killTree(this.child.pid);
  }

  /** @param {number | undefined} pid 结束整棵后端进程树（Windows 用 taskkill /T /F）。 */
  killTree(pid) {
    if (pid === undefined) return;
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true });
    } else {
      try {
        process.kill(pid, 'SIGTERM');
      } catch {
        /* 进程已自行退出 */
      }
    }
  }
}
