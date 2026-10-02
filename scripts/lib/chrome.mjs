import { spawn } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const chromeCandidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

/** CI machines can be slow to start Chrome: wait this long, then retry once. */
const STARTUP_TIMEOUT_MS = 30_000;
const STARTUP_ATTEMPTS = 2;
const POLL_MS = 250;

/** The first tab of the debugging endpoint, opening one if Chrome is up without any. */
const findPage = async (port) => {
  try {
    const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    const page = targets.find((item) => item.type === 'page');
    if (page) {
      return page;
    }

    return await (
      await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })
    ).json();
  } catch {
    return undefined;
  }
};

const startChrome = async (chromePath, port) => {
  const profile = join(process.env.TEMP ?? '/tmp', `milimon-chrome-${port}`);
  rmSync(profile, { recursive: true, force: true });
  const chrome = spawn(
    chromePath,
    [
      '--headless=new',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--no-default-browser-check',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  );
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await sleep(POLL_MS);
    const page = await findPage(port);
    if (page?.webSocketDebuggerUrl) {
      return { chrome, page };
    }
  }
  chrome.kill();

  return undefined;
};

/** Starts headless Chrome on its first tab; returns `send`, `evaluate` and `close`. */
export const launchChrome = async (port) => {
  const chromePath = chromeCandidates.find((candidate) => existsSync(candidate));
  if (!chromePath) {
    throw new Error('Chrome not found. Set CHROME_PATH.');
  }

  let started;
  for (let attempt = 1; attempt <= STARTUP_ATTEMPTS && !started; attempt += 1) {
    started = await startChrome(chromePath, port);
  }
  if (!started) {
    throw new Error(
      `Chrome did not expose a page on port ${port} after ${STARTUP_ATTEMPTS} attempts`,
    );
  }

  const { chrome, page } = started;
  try {
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve);
      ws.addEventListener('error', reject);
    });
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
      (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }))
        .result.result.value;
    const close = () => {
      ws.close();
      chrome.kill();
    };

    return { send, evaluate, close };
  } catch (error) {
    chrome.kill();
    throw error;
  }
};
