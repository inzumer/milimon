// Inline scripts as exact strings, hashed for the CSP in astro.config.mjs. No imports on purpose.

/** Applies the color scheme before the first paint: saved choice first, then the OS (live). */
export const themeScript = (storageKey: string): string =>
  `(()=>{const k=${JSON.stringify(storageKey)};const r=document.documentElement;const m=matchMedia('(prefers-color-scheme: dark)');const s=()=>{try{const v=JSON.parse(localStorage.getItem(k)||'null')?.colorScheme;return v==='dark'||v==='light'?v:null}catch{return null}};const a=()=>{r.dataset.colorScheme=s()??(m.matches?'dark':'light')};a();m.addEventListener('change',()=>{if(!s())a()})})();`;

export interface LanguageRedirectOptions {
  storageKey: string;
  locales: readonly string[];
  fallbackLocale: string;
  base: string;
}

/** Root page: saved language, then the browser's languages, then the default. */
export const languageRedirectScript = ({
  storageKey,
  locales,
  fallbackLocale,
  base,
}: LanguageRedirectOptions): string =>
  `(()=>{const k=${JSON.stringify(storageKey)};const l=${JSON.stringify(locales)};let g=null;try{const v=JSON.parse(localStorage.getItem(k)||'null')?.locale;g=l.includes(v)?v:null}catch{g=null}if(!g){const p=navigator.languages?.length?navigator.languages:[navigator.language];g=p.map((t)=>String(t).slice(0,2).toLowerCase()).find((c)=>l.includes(c))??${JSON.stringify(fallbackLocale)}}location.replace(${JSON.stringify(base)}+'/'+g)})();`;

export interface NotFoundLanguageOptions {
  locales: readonly string[];
  base: string;
}

/** 404 page: shows the message in the language of the requested URL (`/en/…`), if any. */
export const notFoundLanguageScript = ({ locales, base }: NotFoundLanguageOptions): string =>
  `(()=>{const b=${JSON.stringify(base)};const p=location.pathname.startsWith(b)?location.pathname.slice(b.length):location.pathname;const g=p.split('/')[1];if(!${JSON.stringify(locales)}.includes(g))return;document.documentElement.lang=g;document.querySelectorAll('[data-not-found]').forEach((s)=>{s.hidden=s.dataset.notFound!==g})})();`;
