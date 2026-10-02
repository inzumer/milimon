import { spawn } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative, sep } from 'node:path';
import { launchChrome, sleep } from './lib/chrome.mjs';

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const PORT = Number(process.env.PORT ?? 4329);
const SITE_BASE = (process.env.BASE_PATH ?? '').replace(/\/+$/, '');
const BASE = `http://localhost:${PORT}${SITE_BASE}`;

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
        .replace(/(\/?index)?\.html$/, '')}`,
    ];
  });
})('dist');

const astroPackage = require.resolve('astro/package.json');
const astroBin = join(astroPackage, '..', require(astroPackage).bin.astro);
const preview = spawn(process.execPath, [astroBin, 'preview', '--port', String(PORT)], {
  stdio: 'ignore',
});
let browser;
try {
  let previewExited = false;
  preview.on('exit', () => {
    previewExited = true;
  });
  let ready = false;
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

  browser = await launchChrome(PORT + 1);
  const { send, evaluate } = browser;
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
  browser?.close();
  preview.kill();
}
