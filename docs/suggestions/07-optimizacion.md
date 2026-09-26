# 07 · Optimización y deuda técnica

## Rendimiento

- **Imágenes fuente pesadas**: `logo.png` y `star.png` pesan ~1,6 MB y `error.png` ~500 KB. En la
  web ya se sirven optimizadas (`astro:assets` genera WebP chico), pero conviene guardar las
  fuentes en 1024 px para que el repo y los builds sean más livianos.
- **Íconos del manifest** (`android-chrome-512x512.png`, ~330 KB): comprimirlos.
- **JavaScript**: el menú y el banner de cookies se hidratan con `client:load`; el menú podría
  usar `client:idle` y cargar el contenido del cajón recién al abrirlo.
- **Fuentes**: subconjunto de Nunito y Lobster Two solo con los caracteres de es/en.
- **Lighthouse CI** con presupuestos (peso por página, LCP, CLS) en cada PR.
- **Precarga** de la página siguiente más probable (Astro prefetch) en enlaces del menú y cards.

## Deuda técnica

- `ui-library`: sumar `.gitattributes` (`* text=auto eol=lf`); hoy `pnpm format` reescribe los
  finales de línea de ~100 archivos en Windows.
- Renombrar las carpetas locales (`milimon-cost-lab` → `milimon`, `api-milimon-cost-lab` →
  `api-milimon`) con todo cerrado.
- Test intermitente del aviso "despertando" del login (depende de un temporizador): hoy tiene más
  margen; si reaparece, pasarlo a temporizadores falsos.
- Unificar los scripts de capturas (`scripts/lib/chrome.mjs`) en un comando para revisar páginas en
  mobile y escritorio.
- Revisar el texto explicativo de fórmulas y temas contra el material del curso (con el PDF a
  mano) para confirmar que no quedó ninguna frase igual.
