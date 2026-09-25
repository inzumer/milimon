// Generates the Open Graph / Twitter share images (1200×630, one per language) into public/og/.
// Rendered by headless Chrome so the brand fonts (Lobster Two, Nunito) and colors are exact.
// The PNGs are committed: run this only when the logo, the texts or the brand change.
//
// Usage: pnpm og:image
// Env: CHROME_PATH (optional) — path to Chrome/Chromium.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { launchChrome, sleep } from './lib/chrome.mjs';

const require = createRequire(import.meta.url);
const dataUrl = (path, type) => `data:${type};base64,${readFileSync(path).toString('base64')}`;

const lobster = dataUrl(
  require.resolve('@fontsource/lobster-two/files/lobster-two-latin-700-normal.woff2'),
  'font/woff2',
);
const nunito = dataUrl(
  require.resolve('@fontsource-variable/nunito/files/nunito-latin-wght-normal.woff2'),
  'font/woff2',
);
const logo = dataUrl('src/assets/logo.png', 'image/png');

const TEXTS = {
  es: {
    tagline: 'Costos, desechos y mermas en gastronomía',
    detail: 'Calculadora y manual de estudio con cada fórmula explicada paso a paso.',
  },
  en: {
    tagline: 'Food cost, trim waste and cooking loss',
    detail: 'Calculator and study guide with every formula explained step by step.',
  },
};

const html = ({ tagline, detail }) => `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @font-face { font-family: 'Lobster Two'; font-weight: 700; src: url(${lobster}) format('woff2'); }
  @font-face { font-family: 'Nunito'; font-weight: 200 1000; src: url(${nunito}) format('woff2'); }
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; overflow: hidden; background: #FDF7F1; color: #2F201B;
    font-family: 'Nunito', sans-serif; display: flex; align-items: center; gap: 56px; padding: 0 80px;
    border-bottom: 24px solid #F6AF27; }
  img { width: 380px; height: 380px; flex: none; }
  h1 { font-family: 'Lobster Two', cursive; font-weight: 700; font-size: 84px; line-height: 1.05; }
  .tagline { margin-top: 24px; font-size: 38px; font-weight: 800; line-height: 1.2; }
  .detail { margin-top: 16px; font-size: 28px; line-height: 1.35; color: #5b4a42; }
</style></head><body>
  <img src="${logo}" alt="">
  <div>
    <h1>Milimon Cost Lab</h1>
    <p class="tagline">${tagline}</p>
    <p class="detail">${detail}</p>
  </div>
</body></html>`;

const browser = await launchChrome(Number(process.env.PORT ?? 4339));
try {
  const { send, evaluate } = browser;
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1200,
    height: 630,
    deviceScaleFactor: 1,
    mobile: false,
  });
  mkdirSync('public/og', { recursive: true });
  for (const [lang, texts] of Object.entries(TEXTS)) {
    const file = join(tmpdir(), `milimon-og-${lang}.html`);
    writeFileSync(file, html(texts));
    await send('Page.navigate', { url: pathToFileURL(file).href });
    await sleep(500);
    await evaluate('document.fonts.ready.then(() => true)');
    await sleep(200);
    const { data } = (
      await send('Page.captureScreenshot', {
        format: 'png',
        clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 },
      })
    ).result;
    writeFileSync(`public/og/og-${lang}.png`, Buffer.from(data, 'base64'));
    console.log(`public/og/og-${lang}.png`);
  }
} finally {
  browser.close();
}
