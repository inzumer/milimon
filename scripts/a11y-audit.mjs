// Accessibility audit of every built page with axe-core in headless Chrome (real layout and colors,
// so contrast is checked too), in light and dark mode, with the hamburger menu closed and open.
//
// Usage: pnpm build && pnpm audit:a11y
// Env: CHROME_PATH (optional) — path to Chrome/Chromium; PORT (optional, default 4329).
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative, sep } from 'node:path';

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const PORT = Number(process.env.PORT ?? 4329);
const BASE = `http://localhost:${PORT}`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const chromeCandidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const chromePath = chromeCandidates.find((candidate) => existsSync(candidate));
if (!chromePath) {
  console.error('Chrome not found. Set CHROME_PATH.');
  process.exit(2);
}

const pages = (function collect(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      return entry === '_astro' ? [] : collect(path);
    }
    if (!entry.endsWith('.html') || entry === '404.html' || path === join('dist', 'index.html')) {
      return [];
    }
    return [
      `/${relative('dist', path)
        .split(sep)
        .join('/')
        .replace(/\/?index\.html$/, '')}`,
    ];
  });
})('dist');

const astroPackage = require.resolve('astro/package.json');
const astroBin = join(astroPackage, '..', require(astroPackage).bin.astro);
const preview = spawn(process.execPath, [astroBin, 'preview', '--port', String(PORT)], {
  stdio: 'ignore',
});
const chromePort = PORT + 1;
const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${chromePort}`,
    `--user-data-dir=${join(process.env.TEMP ?? '/tmp', `a11y-${chromePort}`)}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);
const cleanup = () => {
  chrome.kill();
  preview.kill();
};

try {
  let previewExited = false;
  preview.on('exit', () => {
    previewExited = true;
  });
  let ready = false;
  // Up to 60 s: the first start after a build can be slow on a busy machine.
  for (let i = 0; i < 120 && !ready && !previewExited; i += 1) {
    try {
      ready = (await fetch(`${BASE}/es`)).ok;
    } catch {
      ready = false;
    }
    if (!ready) {
      await sleep(500);
    }
  }
  if (!ready) {
    throw new Error(
      previewExited
        ? `The preview server exited before starting (is port ${PORT} in use?)`
        : `The preview server did not start on ${BASE}`,
    );
  }
  let target;
  for (let i = 0; i < 50 && !target; i += 1) {
    await sleep(200);
    try {
      target = (await (await fetch(`http://127.0.0.1:${chromePort}/json`)).json()).find(
        (item) => item.type === 'page',
      );
    } catch {}
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener('open', resolve));
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    pending.get(message.id)?.(message);
    pending.delete(message.id);
  });
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      id += 1;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) =>
    (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result
      .result.value;

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });

  const failures = [];
  for (const scheme of ['light', 'dark']) {
    await send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-color-scheme', value: scheme }],
    });
    for (const [index, page] of pages.entries()) {
      const navigation = await send('Page.navigate', { url: `${BASE}${page}` });
      if (navigation.result?.errorText) {
        throw new Error(`Could not load ${page}: ${navigation.result.errorText}`);
      }
      await sleep(700);
      // Open the menu on one page per language to audit the drawer as well.
      const withMenu = index < 2;
      if (withMenu) {
        await evaluate(`document.querySelector('button[aria-controls]')?.click()`);
        await sleep(400);
      }
      await evaluate(axeSource);
      const violations = await evaluate(
        `axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } })
          .then((r) => r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ') + ' — ' + (n.failureSummary || '').split('\\n').slice(0, 2).join(' ')) })))`,
      );
      for (const violation of violations) {
        failures.push({ page: `${page}${withMenu ? ' (menu open)' : ''}`, scheme, ...violation });
      }
    }
  }
  ws.close();
  console.log(`Audited ${pages.length} pages × 2 color schemes.`);
  if (failures.length > 0) {
    for (const failure of failures) {
      console.log(
        `\n[${failure.impact}] ${failure.id} — ${failure.help}\n  ${failure.page} (${failure.scheme})`,
      );
      for (const node of failure.nodes) {
        console.log(`   · ${node}`);
      }
    }
    console.log(`\n${failures.length} violation(s).`);
    process.exitCode = 1;
  } else {
    console.log('No accessibility violations found.');
  }
} finally {
  cleanup();
}
