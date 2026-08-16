// CI gate: en/zh string tables must expose identical keys with identical {placeholder} sets.
import { setLocale, strings } from '../src/i18n.js';

setLocale('en');
const en = strings();
setLocale('zh');
const zh = strings();

const enKeys = Object.keys(en);
const zhKeys = Object.keys(zh);
const problems = [];

for (const key of enKeys) if (!zhKeys.includes(key)) problems.push(`missing in zh: ${key}`);
for (const key of zhKeys) if (!enKeys.includes(key)) problems.push(`missing in en: ${key}`);

const placeholders = text => [...String(text).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',');
for (const key of enKeys) {
  if (!(key in zh)) continue;
  const a = placeholders(en[key]);
  const b = placeholders(zh[key]);
  if (a !== b) problems.push(`placeholder mismatch in ${key}: en={${a}} zh={${b}}`);
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`i18n OK: ${enKeys.length} keys, placeholders aligned`);
