// Сборка тестового сайта в dist-staging/. Боевые файлы репозитория не меняет.
// node tools/build-staging.mjs
// node tools/build-staging.mjs --backend tools/staging/backend.local.json
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { toDemo } from './staging/demo.mjs';
import { MARKERS, assertBackend, auditDist, renderNet, renderSw, scrubText } from './staging/policy.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const TEXT = /\.(js|mjs|html|json|css|txt|webmanifest|xml|svg)$/i;
const SKIP_DIR = new Set(['.git', 'node_modules', 'tools', 'dist-staging', 'docs', '.github']);
const SKIP_FILE = new Set(['CNAME', 'README.md', '.gitignore', 'sitemap.xml']);
const SKIP_REL = ['img/members', 'img/uploads', 'img/news', 'img/awards'];

const CSP_DEMO = "default-src 'self'; script-src 'self' https://www.youtube.com/iframe_api https://www.youtube.com/s/player/ https://s.ytimg.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob:; media-src 'self' data: blob:; connect-src 'self' data: blob: https://www.youtube.com https://www.youtube-nocookie.com https://s.ytimg.com; frame-src https://www.youtube.com https://www.youtube-nocookie.com https://vk.com https://vkvideo.ru https://rutube.ru; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests";
const CSP_BACKEND = "default-src 'self'; script-src 'self' https://www.youtube.com/iframe_api https://www.youtube.com/s/player/ https://s.ytimg.com https://www.gstatic.com/firebasejs/ https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob:; media-src 'self' data: blob:; connect-src 'self' data: blob: https://www.youtube.com https://www.youtube-nocookie.com https://s.ytimg.com https://*.googleapis.com https://www.google.com/recaptcha/ https://www.gstatic.com/firebasejs/ https://www.gstatic.com/recaptcha/; frame-src https://www.youtube.com https://www.youtube-nocookie.com https://vk.com https://vkvideo.ru https://rutube.ru https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests";

const BANNER_CSS = `<style id="stg-css">#vppka-test{position:fixed;top:0;left:0;right:0;z-index:80;background:#6e1219;color:#f4ead8;border-bottom:3px solid #c6a15a;text-align:center;padding:7px 12px 8px;font:14px/1.15 var(--fd);letter-spacing:.16em;text-transform:uppercase}#vppka-test small{display:block;letter-spacing:.04em;text-transform:none;font:12px/1.3 var(--fb);color:#e7dcc8;margin-top:2px}body{padding-top:56px}.nav{top:56px}</style>`;
const BANNER = `<div id="vppka-test" role="status">ТЕСТОВАЯ ВЕРСИЯ<small>Демонстрационные данные. Записи в боевую базу, Discord, заявки и пуши выключены.</small></div>`;

function relOf(root, file) {
  return path.relative(root, file).split(path.sep).join('/');
}

export function transformIndex(html, demo, frameHost) {
  let csp = demo ? CSP_DEMO : CSP_BACKEND;
  if (!demo && frameHost) {
    if (MARKERS.some(m => frameHost.includes(m)) || !/^https:\/\/[a-z0-9.-]+$/.test(frameHost)) throw new Error('Некорректный authDomain тестового backend.');
    csp = csp.replace('frame-src ', 'frame-src ' + frameHost + ' ');
  }
  let s = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, `<meta http-equiv="Content-Security-Policy" content="${csp}">`);
  if (s.includes('vppca-rmrp') || (demo && s.includes('googleapis'))) throw new Error('Не удалось заменить CSP тестовой сборки.');
  s = s.replace(/\n?<meta name="yandex-verification"[^>]*>/, '');
  s = s.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="robots" content="noindex, nofollow">');
  s = s.replace(/<link rel="canonical"[^>]*>\n?/, '');
  s = s.replace(/<meta property="og:url"[^>]*>/, '');
  s = s.replaceAll('https://vppka-arbat-rmrp.ru/', '');
  s = s.replaceAll('https://vppka-arbat-rmrp.ru', '');
  s = s.replace(/<title>[^<]*<\/title>/, '<title>ТЕСТОВАЯ ВЕРСИЯ — ВППКА «Коммунисты Арбата»</title>');
  s = s.replace(/<link rel="stylesheet" href="style\.css\?v=\d+">/, m => m + '\n' + BANNER_CSS);
  s = s.replace(/<script src="guard\.js\?v=\d+"><\/script>/, m => '<script src="staging-net.js"></script>\n' + m);
  s = s.replace('<body>', '<body>\n' + BANNER);
  s = s.replace(/<script src="ph\.js\?v=\d+"><\/script>/, m => '<script src="staging-mode.js"></script>\n<script src="staging-ui.js"></script>\n' + m);
  if (!s.includes('ТЕСТОВАЯ ВЕРСИЯ') || !s.includes('staging-net.js') || s.includes('vppca-rmrp.firebaseapp.com')) {
    throw new Error('index.html тестовой сборки собрался не полностью.');
  }
  if (demo && /googleapis/.test(s)) throw new Error('В демо-сборке CSP всё ещё пускает Google API.');
  return s;
}

function firebaseSource(demo, backend) {
  if (demo) {
    return `// Тестовая сборка. Боевой проект сюда не подставляется.
// PASTE_ — сигнал auth.js не вызывать Firebase.
export const firebaseConfig = {
  apiKey: "STAGING_DISABLED_PASTE_",
  authDomain: "staging.invalid",
  projectId: "staging-local-demo",
  storageBucket: "staging.invalid",
  messagingSenderId: "0",
  appId: "staging-demo"
};
export const appCheckSiteKey = '';
export const discordOAuth = { clientId: '', redirect: '' };
`;
  }
  const f = backend.firebaseConfig;
  const dc = backend.discordOAuth || { clientId: '', redirect: '' };
  const body = {
    firebaseConfig: {
      apiKey: String(f.apiKey || ''),
      authDomain: String(f.authDomain || ''),
      projectId: String(f.projectId || ''),
      storageBucket: String(f.storageBucket || ''),
      messagingSenderId: String(f.messagingSenderId || ''),
      appId: String(f.appId || ''),
    },
    appCheckSiteKey: String(backend.appCheckSiteKey || ''),
    discordOAuth: { clientId: String(dc.clientId || ''), redirect: String(dc.redirect || '') },
  };
  return `// Тестовая сборка с отдельным backend. Боевой проект сюда не входит.
export const firebaseConfig = ${JSON.stringify(body.firebaseConfig, null, 2)};
export const appCheckSiteKey = ${JSON.stringify(body.appCheckSiteKey)};
export const discordOAuth = ${JSON.stringify(body.discordOAuth)};
`;
}

async function walk(dir, root, out) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const abs = path.join(dir, ent.name);
    const rel = relOf(root, abs);
    if (ent.isDirectory()) {
      if (SKIP_DIR.has(ent.name) || SKIP_REL.some(p => rel === p || rel.startsWith(p + '/'))) continue;
      await walk(abs, root, out);
      continue;
    }
    if (SKIP_FILE.has(ent.name) || SKIP_REL.some(p => rel === p || rel.startsWith(p + '/'))) continue;
    const dest = path.join(out, rel);
    await mkdir(path.dirname(dest), { recursive: true });
    if (TEXT.test(ent.name)) {
      const raw = await readFile(abs, 'utf8');
      await writeFile(dest, scrubText(raw));
    } else {
      await cp(abs, dest);
    }
  }
}

async function readTree(dir, base, bag) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) await readTree(abs, base, bag);
    else if (TEXT.test(ent.name)) bag.set(relOf(base, abs), await readFile(abs, 'utf8'));
  }
  return bag;
}

export async function buildStaging(opts = {}) {
  const root = opts.root || ROOT;
  const out = path.resolve(opts.out || path.join(root, 'dist-staging'));
  const demo = !opts.backend;
  let backend = null;
  if (opts.backend) {
    backend = assertBackend(JSON.parse(await readFile(opts.backend, 'utf8')));
  }
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  await walk(root, root, out);
  const frameHost = !demo && backend.firebaseConfig.authDomain ? 'https://' + backend.firebaseConfig.authDomain : '';
  const index = transformIndex(await readFile(path.join(root, 'index.html'), 'utf8'), demo, frameHost);
  const content = toDemo(JSON.parse(await readFile(path.join(root, 'content.json'), 'utf8')));
  const version = JSON.parse(await readFile(path.join(root, 'version.json'), 'utf8'));
  const cache = 'vppka-staging-v' + String(version.v || '0');
  const manifest = {
    name: 'ВППКА — тестовая версия',
    short_name: 'ВППКА ТЕСТ',
    id: './staging',
    start_url: './',
    scope: './',
    display: 'standalone',
    background_color: '#1a1612',
    theme_color: '#6e1219',
    lang: 'ru',
    icons: JSON.parse(await readFile(path.join(root, 'manifest.webmanifest'), 'utf8')).icons,
  };
  await writeFile(path.join(out, 'index.html'), index);
  await writeFile(path.join(out, 'content.json'), JSON.stringify(content));
  await writeFile(path.join(out, 'firebase-config.js'), firebaseSource(demo, backend));
  await writeFile(path.join(out, 'staging-net.js'), renderNet(demo));
  await writeFile(path.join(out, 'staging-ui.js'), await readFile(path.join(root, 'tools/staging/ui.js')));
  await writeFile(path.join(out, 'staging-mode.js'), `window.__VPPKA_STAGING=${JSON.stringify({ demo, backend: !demo })};\n`);
  await writeFile(path.join(out, 'sw.js'), renderSw(cache, demo));
  await writeFile(path.join(out, 'manifest.webmanifest'), JSON.stringify(manifest));
  await writeFile(path.join(out, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
  await writeFile(path.join(out, 'STAGING.txt'), 'Тестовая сборка. Не выкладывать на vppka-arbat-rmrp.ru и не подменять ей ветку main в GitHub Pages.\n');
  const files = await readTree(out, out, new Map());
  const errors = auditDist(files);
  if (!demo && files.get('firebase-config.js').includes('PASTE_')) errors.push('режим backend случайно остался в демо');
  if (demo && !files.get('firebase-config.js').includes('PASTE_')) errors.push('демо-сборка обязана отключать Firebase меткой PASTE_');
  if (errors.length) throw new Error('Проверка тестовой сборки не пройдена:\n' + errors.join('\n'));
  return { out, demo, cache };
}

async function main() {
  const args = process.argv.slice(2);
  let out, backend;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out') out = args[++i];
    else if (args[i] === '--backend') backend = args[++i];
    else throw new Error('Неизвестный аргумент: ' + args[i]);
  }
  const built = await buildStaging({ out, backend });
  console.log(built.demo ? 'демо-сборка' : 'сборка с отдельным backend', built.out, built.cache);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(e => { console.error(e.message || e); process.exit(1); });
}
