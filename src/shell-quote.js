/**
 * 给 `spawn(..., {shell: true})` 的 command 与 args 加引号。
 * Node 在 shell:true 时把 command 和各参数用空格裸拼接成一整串交给 cmd / sh，
 * 而本应用 userData 目录「DSH Desktop」必含空格（official-runtime、bundled-node 都在其下），
 * 不加引号时路径会在空格处断开。shell:false 的数组传参不经拼接，天然安全，不要用本函数。
 */

/**
 * 按当前平台的 shell 语义为单个 token 加引号。
 * 仅在 shell:true 的 spawn 调用处使用；不要写回配置或日志里的原始值。
 * win32 按 cmd 语义：含空白就用双引号包裹（token 内已有的 `"` 双写转义）。
 * POSIX 按 sh 语义：含安全字符集外的字符就用单引号包裹，内部 `'` 转成 `'\''`。
 * @param {string} token command 或单个参数。
 * @returns {string} 可安全拼进 shell 命令行的 token。
 */
export function quoteForShell(token) {
  const text = String(token);
  if (process.platform === 'win32') {
    if (!/\s/.test(text)) return text;
    return `"${text.replaceAll('"', '""')}"`;
  }
  if (/^[A-Za-z0-9_\-./=]+$/.test(text)) return text;
  return `'${text.replaceAll("'", "'\\''")}'`;
}
