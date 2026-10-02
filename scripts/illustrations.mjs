// Splits each brand PNG into a figure (webp) and a recolorable SVG background, plus baked
// orange composites, favicons and loader marks. Run `pnpm illustrations` after changing one.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const NAMES = ['logo', 'star', 'error'];
const OUT = 'src/assets/illustrations';
/** The primary 500 of the theme (`--color-primary-500: r g b;`), the default illustration background. */
const primary = () => {
  const match = /--color-primary-500:\s*(\d+)\s+(\d+)\s+(\d+)/.exec(
    readFileSync('src/styles/theme.css', 'utf8'),
  );
  if (!match) {
    throw new Error('--color-primary-500 not found in theme.css');
  }

  return `rgb(${match[1]}, ${match[2]}, ${match[3]})`;
};
/** The flat yellow of the original backgrounds. */
const BACKGROUND = [250, 176, 22];
/** Max RGB distance of a background pixel to BACKGROUND. */
const TOLERANCE = 58;
/** Background pockets smaller than this (in pixels) are left alone. */
const MIN_POCKET = 400;
/** Flat background regions average under 20 from BACKGROUND; yellow drawing parts over 35. */
const MAX_MEAN_DISTANCE = 25;
/** Outline color the anti-aliased edges are unmixed against. */
const OUTLINE = [36, 24, 20];

const distance = (data, i, color) =>
  Math.hypot(data[i] - color[0], data[i + 1] - color[1], data[i + 2] - color[2]);

/** Connected components (4-neighbourhood) of the pixels matching `test`. */
const components = (width, height, test, measure) => {
  const label = new Int32Array(width * height).fill(-1);
  const sizes = [];
  const sums = [];
  const stack = [];
  for (let start = 0; start < width * height; start += 1) {
    if (label[start] !== -1 || !test(start)) {
      continue;
    }

    const id = sizes.length;
    let size = 0;
    let sum = 0;
    stack.push(start);
    label[start] = id;
    while (stack.length > 0) {
      const p = stack.pop();
      size += 1;
      sum += measure(p);
      const x = p % width;
      const y = (p - x) / width;
      for (const q of [
        x > 0 ? p - 1 : -1,
        x < width - 1 ? p + 1 : -1,
        y > 0 ? p - width : -1,
        y < height - 1 ? p + width : -1,
      ]) {
        if (q >= 0 && label[q] === -1 && test(q)) {
          label[q] = id;
          stack.push(q);
        }
      }
    }
    sizes.push(size);
    sums.push(sum);
  }

  return { label, sizes, means: sums.map((total, i) => total / sizes[i]) };
};

/** Outer contour of the largest filled region of `mask`, as a closed list of points (Moore tracing). */
const outerContour = (width, height, mask) => {
  const at = (x, y) => x >= 0 && y >= 0 && x < width && y < height && mask[y * width + x] === 1;
  let start = -1;
  for (let p = 0; p < width * height && start < 0; p += 1) {
    if (mask[p]) {
      start = p;
    }
  }
  const sx = start % width;
  const sy = (start - sx) / width;
  const dirs = [
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
  ];
  const points = [[sx, sy]];
  let [x, y] = [sx, sy];
  let dir = 7;
  for (let guard = 0; guard < width * height * 4; guard += 1) {
    let moved = false;
    for (let k = 0; k < 8; k += 1) {
      const d = (dir + 6 + k) % 8;
      const nx = x + dirs[d][0];
      const ny = y + dirs[d][1];
      if (at(nx, ny)) {
        [x, y, dir, moved] = [nx, ny, d, true];
        break;
      }
    }
    if (!moved || (x === sx && y === sy)) {
      break;
    }

    points.push([x, y]);
  }

  return points;
};

/** Douglas–Peucker simplification of a closed polyline. */
const simplify = (points, epsilon) => {
  const rdp = (pts) => {
    if (pts.length < 3) {
      return pts;
    }

    const [a, b] = [pts[0], pts[pts.length - 1]];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    let [index, max] = [0, 0];
    for (let i = 1; i < pts.length - 1; i += 1) {
      const d =
        Math.abs(
          (b[1] - a[1]) * pts[i][0] - (b[0] - a[0]) * pts[i][1] + b[0] * a[1] - b[1] * a[0],
        ) / len;
      if (d > max) {
        [index, max] = [i, d];
      }
    }

    return max > epsilon
      ? [...rdp(pts.slice(0, index + 1)).slice(0, -1), ...rdp(pts.slice(index))]
      : [a, b];
  };
  const half = Math.floor(points.length / 2);

  return [...rdp(points.slice(0, half + 1)).slice(0, -1), ...rdp(points.slice(half))];
};

const split = async (name) => {
  const { data, info } = await sharp(`src/assets/${name}.png`)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const isYellow = (p) => data[p * 4 + 3] > 200 && distance(data, p * 4, BACKGROUND) < TOLERANCE;
  const { label, sizes, means } = components(width, height, isYellow, (p) =>
    distance(data, p * 4, BACKGROUND),
  );

  const background = new Uint8Array(width * height);
  for (let p = 0; p < width * height; p += 1) {
    const id = label[p];
    if (id >= 0 && sizes[id] >= MIN_POCKET && means[id] < MAX_MEAN_DISTANCE) {
      background[p] = 1;
    }
  }

  // Figure layer: background pixels become transparent; the pixels bordering the background are
  // unmixed (color = a·outline + (1−a)·yellow) so recoloring leaves no yellow fringe.
  const figure = Buffer.from(data);
  for (let p = 0; p < width * height; p += 1) {
    const i = p * 4;
    if (background[p]) {
      figure[i + 3] = 0;
      continue;
    }

    const x = p % width;
    const y = (p - x) / width;
    let nearBackground = false;
    for (let dy = -2; dy <= 2 && !nearBackground; dy += 1) {
      for (let dx = -2; dx <= 2 && !nearBackground; dx += 1) {
        const q = (y + dy) * width + (x + dx);
        if (x + dx >= 0 && y + dy >= 0 && x + dx < width && y + dy < height && background[q]) {
          nearBackground = true;
        }
      }
    }
    if (!nearBackground) {
      continue;
    }

    const toBackground = distance(data, i, BACKGROUND);
    const span = Math.hypot(
      OUTLINE[0] - BACKGROUND[0],
      OUTLINE[1] - BACKGROUND[1],
      OUTLINE[2] - BACKGROUND[2],
    );
    const alpha = Math.min(1, toBackground / span);
    if (alpha < 0.98) {
      figure[i] = OUTLINE[0];
      figure[i + 1] = OUTLINE[1];
      figure[i + 2] = OUTLINE[2];
      figure[i + 3] = Math.round(alpha * data[i + 3]);
    }
  }
  await sharp(figure, { raw: { width, height, channels: 4 } })
    .webp({ quality: 88, alphaQuality: 100 })
    .toFile(`${OUT}/${name}-figure.webp`);

  // Background shape: the outer silhouette of the whole illustration, shrunk by 5px so its edge
  // stays under the frame. The figure layer covers everything but the old background, so the
  // shape only shows where the yellow was.
  const opaque = (p) => data[p * 4 + 3] > 128;
  const filled = new Uint8Array(width * height);
  for (let p = 0; p < width * height; p += 1) {
    if (!opaque(p)) {
      continue;
    }

    const x = p % width;
    const y = (p - x) / width;
    let inside = true;
    for (let dy = -5; dy <= 5 && inside; dy += 1) {
      for (let dx = -5; dx <= 5 && inside; dx += 1) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height || !opaque(ny * width + nx)) {
          inside = false;
        }
      }
    }
    if (inside) {
      filled[p] = 1;
    }
  }
  const contour = simplify(outerContour(width, height, filled), 1.2);
  const d = `M${contour.map(([x, y]) => `${x} ${y}`).join('L')}Z`;
  writeFileSync(
    `${OUT}/${name}-background.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><path fill="currentColor" d="${d}"/></svg>\n`,
  );
  // Single image with the brand color baked in.
  const svg = readFileSync(`${OUT}/${name}-background.svg`, 'utf8').replace(
    'currentColor',
    primary(),
  );
  await sharp(Buffer.from(svg), { density: 72 })
    .resize(width, height)
    .composite([{ input: `${OUT}/${name}-figure.webp` }])
    .webp({ quality: 90 })
    .toFile(`${OUT}/${name}.webp`);

  const pixels = background.reduce((sum, v) => sum + v, 0);
  process.stdout.write(`${name}: ${pixels} background px, contour ${contour.length} points\n`);
};

/** Favicon sizes written to public/ from the baked logo. */
const FAVICONS = {
  'favicon-16x16.png': 16,
  'favicon-32x32.png': 32,
  'apple-touch-icon.png': 180,
  'android-chrome-192x192.png': 192,
  'android-chrome-512x512.png': 512,
};
/** Sizes embedded (as PNG) in favicon.ico. */
const ICO_SIZES = [16, 32, 48];

/** Small baked marks for loaders (logo and star), light enough to show while loading. */
const MARK_SIZE = 192;
const marks = async () => {
  for (const name of ['logo', 'star']) {
    await sharp(`${OUT}/${name}.webp`)
      .resize(MARK_SIZE, MARK_SIZE)
      .webp({ quality: 85 })
      .toFile(`${OUT}/${name}-mark.webp`);
  }
};

const favicons = async () => {
  const icon = (size) =>
    sharp(`${OUT}/logo.webp`)
      .resize(size, size)
      .png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 })
      .toBuffer();
  for (const [file, size] of Object.entries(FAVICONS)) {
    writeFileSync(`public/${file}`, await icon(size));
  }
  // ICO container: header, one 16-byte entry per image, then the PNG payloads.
  const images = await Promise.all(ICO_SIZES.map(icon));
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach((png, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(ICO_SIZES[i], entry);
    header.writeUInt8(ICO_SIZES[i], entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  writeFileSync('public/favicon.ico', Buffer.concat([header, ...images]));
};

mkdirSync(OUT, { recursive: true });
for (const name of NAMES) {
  await split(name);
}
await favicons();
await marks();
