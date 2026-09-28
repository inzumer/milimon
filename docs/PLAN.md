# Milimon — Plan de implementación

App web para calcular costos, desechos y mermas en gastronomía, con explicación de cada fórmula.
Bilingüe (`/es`, `/en`), modo claro y oscuro, mobile-first, construida con Astro + islas de React
sobre `@inzumer/ui-library` + `@inzumer/tokens` personalizados con la identidad de Milimon.

- **Título de la app:** `Milimon` (nombre de la carpeta del proyecto, `milimon`).
- **Fuente de verdad del contenido:** `AyG- Manual.pdf` (Administración y Gestión gastronómica).
  Cuando el manual y `FORMULAS 2026.xlsx` no coinciden, **gana el manual**. Los dos son solo referencia
  de conceptos: los ejemplos, las cifras y los textos del sitio son propios (nada se copia del manual).
- **Tono:** es un **manual de estudio**. Cada fórmula se explica completa: de dónde sale, qué
  significa cada variable, el paso a paso con números, los errores comunes y los redondeos. Nada
  se da por sabido.
- **Alcance:** solo lo que tiene que ver con la calculadora y la administración del restaurante
  (ver §7). Las unidades de RRHH, marketing y comunicación quedan fuera.

---

## 1. Stack y convenciones

| Tema           | Decisión                                                                                                                                                 |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework      | **Astro** (usa Vite por debajo), `output: 'static'` → HTML prerenderizado por idioma y ruta                                                              |
| Interactividad | **Islas de React 19** (`@astrojs/react`) solo donde hace falta: calculadoras, menú, selector de idioma y de tema                                         |
| Lenguaje       | TypeScript 6 estricto (mismas opciones que el `tsconfig` base de ui-library)                                                                             |
| Runtime        | Node **24.21.0 LTS** (`.nvmrc`) + pnpm 12; todo en su última versión compatible y `pnpm audit` limpio (ver ADR 0002)                                     |
| Routing        | Rutas por archivo de Astro bajo `src/pages/[lang]/…`, **slugs siempre en inglés e iguales en ambos idiomas**                                             |
| i18n           | i18n nativo de Astro (`locales: ['es','en']`, `prefixDefaultLocale: true`) + traductor propio tipado (ver §3)                                            |
| Estilos        | Tailwind 4 (`@tailwindcss/vite`) + `DefaultPreset` de `@inzumer/tokens/tailwind` vía `@config`, `cn()` + `cva` como en la lib                            |
| UI             | `@inzumer/ui-library` (npm 1.0.2) + `@inzumer/tokens` (npm 1.1.0)                                                                                        |
| Persistencia   | `localStorage` (últimos valores por calculadora, recetas, tema)                                                                                          |
| Tests          | Vitest (con `getViteConfig` de Astro) + RTL + jsdom + `@vitest/coverage-v8`, **umbral 90%**                                                              |
| Lint/format    | ESLint 10 con las reglas de ui-library (base + react + a11y + testing) **+ `eslint-plugin-astro`**; Prettier + `prettier-plugin-astro`                   |
| Commits/PR     | Conventional Commits + `PULL_REQUEST_TEMPLATE.md` (mismo formato que ui-library)                                                                         |
| Agentes IA     | `CLAUDE.md`, `.claude/.claudecode.json`, `.claude/agents/*` adaptados, `.claude/settings.json` con allowlist                                             |
| CI             | GitHub Actions: `astro check` → lint → test:coverage → build                                                                                             |
| Deploy         | Hosting estático (Vercel o Netlify). No hace falta SSR; si más adelante aparece algo dinámico, se agrega un adapter y esas rutas se renderizan on-demand |

### ¿Por qué Astro?

- El contenido es mayormente estático: explicaciones, fórmulas y ejemplos. Astro lo entrega como HTML
  puro sin JavaScript, así que carga rápido y es bueno para SEO.
- Las calculadoras se hidratan como islas (`client:visible`), así que solo se descarga el JS de la
  calculadora que está en pantalla.
- Tiene i18n nativo; las traducciones por carpeta (§3) se validan con TypeScript y tests.
- Sigue siendo Vite: los aliases de `tsconfig`, Vitest y Tailwind funcionan igual que en ui-library.

### Notas de ecosistema

- `@inzumer/eslint-config`, `prettier-config` y `tsconfig` son `private: true` → **no están en npm**.
  Los copiamos al repo (o, más adelante, los publicamos y los consumimos desde acá).
- El clon local de ui-library está atrasado respecto a npm (ui 1.0.1 vs 1.0.2, tokens 1.0.0 vs 1.1.0).
- `css/reset` fija `html { font-size: 62.5% }` (1rem = 10px). Todo el CSS propio respeta esa escala.
- Los componentes de la lib sin estado (`Card`, `Link`, `RichText`…) se renderizan dentro de `.astro`
  sin directiva `client:*` → salen como HTML estático. Solo lo interactivo se hidrata.

### Aliases (paths relativos solo dentro de la misma carpeta)

```
@components  → src/components/index.ts   (atoms / molecules / organisms / templates, React)
@layouts/*   → src/layouts/*             (layouts .astro)
@constants   → src/constants/index.ts    (valores ajustables)
@hooks       → src/hooks/index.ts        (estado de React, incluidos los hooks de cada calculadora)
@utils       → src/utils/index.ts        (@utils/formulas: fórmulas + registry; @utils/calculation: resultado, validación, redondeo)
@services    → src/services/index.ts     (API de cuentas, GTM, SDKs de login)
@i18n        → src/i18n/index.ts
@assets/*    → src/assets/*
@styles/*    → src/styles/*
```

### Estructura

```
src/
  pages/
    index.astro                      → redirect a /es (+ detección de idioma, ver §4)
    [lang]/
      index.astro                    → Home
      calculator.astro               → Calculadora general (desplegable)
      formulas/index.astro           → Índice de fórmulas
      formulas/[formula].astro       → Explicación + ejemplos + calculadora embebida
      learn/[topic].astro            → Secciones "Aprender"
    404.astro
  layouts/          base-layout.astro (head, meta, hreflang, script de tema), page-layout.astro
  components/       atoms | molecules | organisms | templates  (<Name>/Name.tsx, .styles.ts, __tests__/, index.ts)
  i18n/             ver §3
  hooks/            useFormulaCalculator, useRecipeCostingCalculator, useOmnesCalculator, useDraft, useCurrency, useColorScheme
  utils/
    formulas/       una función pura por fórmula + registry.ts (catálogo: inputs, cálculo, ejemplos propios)
    calculation/    resultado con pasos, validación, redondeo
    …               parseDecimal, formatValue, trackingId, interpolate, rutas, storage, track()
  constants/        valores ajustables (reintentos, timeouts, patrones)
  services/         API de cuentas, Google Tag Manager, SDKs de login
  styles/           theme.css (overrides de tokens claro/oscuro), fonts.css
  test/             setup.ts, fixtures con ejemplos propios
```

Convención de nombres: **kebab-case** en carpetas de contenido y traducciones, archivos `.astro`,
slugs y claves de i18n. Los componentes React mantienen PascalCase, como en ui-library.

---

## 2. Identidad visual

### Colores → tokens

| Rol        | HEX       | Uso                                                            |
| ---------- | --------- | -------------------------------------------------------------- |
| Primario   | `#F6AF27` | `--color-primary-500`; botón primario, acentos, card destacada |
| Secundario | `#FDF7F1` | fondo en modo claro / texto en modo oscuro                     |
| Terciario  | `#2F201B` | texto en modo claro / fondo en modo oscuro                     |

- Generar la escala `primary-50…950` alrededor de `#F6AF27` y una escala `neutral` cálida que vaya
  del crema (50) al marrón (950), para que todos los semánticos (`--surface-*`, `--text-*`,
  `--border-*`, `--btn-*`) deriven solos.
- Override por **CSS plano** en `src/styles/theme.css`, después de `@inzumer/tokens/css/variables`
  (opción 1 de `overriding-styles.mdx`). No hace falta `InzumerProvider`.

### Modo claro y oscuro

| Semántico             | Claro                          | Oscuro                         |
| --------------------- | ------------------------------ | ------------------------------ |
| `--surface-primary`   | crema `#FDF7F1`                | marrón `#2F201B`               |
| `--surface-secondary` | crema más oscuro (neutral-100) | marrón más claro (neutral-900) |
| `--text-primary`      | marrón `#2F201B`               | crema `#FDF7F1`                |
| `--btn-primary-bg`    | `#F6AF27`                      | `#F6AF27` (o primary-400)      |
| `--btn-primary-text`  | marrón                         | marrón                         |
| `--border-focus`      | primary-700 / marrón           | primary-400                    |

- Se usa el mecanismo de la lib: atributo `data-color-scheme="dark"` en `<html>`.
- Valor inicial: preferencia guardada en `localStorage`; si no hay, `prefers-color-scheme`.
- Un script inline y bloqueante en el `<head>` del layout aplica el atributo **antes del primer
  paint** (sin parpadeo de tema, algo clave en sitios estáticos).
- Toggle de tema (isla React) dentro del menú hamburguesa.
- Contraste: el amarillo nunca va como texto sobre crema. Texto blanco sobre `#F6AF27` no pasa,
  así que el botón primario siempre lleva texto marrón (~8:1). Crema sobre marrón ≈ 15:1.
  Verificar cada par con axe en ambos modos.
- El logo tiene borde crema, así que funciona sobre ambos fondos. Validarlo visualmente en oscuro.

### Tipografía

- **Títulos:** Lobster Two (400/700), solo en `h1`/`h2` y el nombre de la app.
- **Textos:** **Nunito**. Tiene formas redondeadas que combinan con Lobster Two, es muy legible en
  mobile y tiene cifras tabulares (`tabular-nums`) para resultados y tablas. Alternativa: Lato.
- Self-host con `@fontsource` (sin request a Google en runtime, mejor LCP) y `preload` de los
  pesos críticos. Se exponen como `--font-display` y `--font-body` y se extiende el preset de Tailwind.

### Layout

- Mobile-first: un único layout hasta **1024px**.
- `≥ 1024px`: contenedor centrado con `max-width: 1024px` (mismo diseño, centrado).
- Header fijo: logo + "Milimon" (Lobster Two) + botón hamburguesa, en todos los tamaños.

---

## 3. Traducciones por carpeta (kebab-case)

Cada fórmula y cada sección tiene su propia carpeta con un archivo por idioma. El nombre de la
carpeta es el **id** de la fórmula y coincide con el **slug de la ruta** (siempre en inglés).

```
src/i18n/
  common/            es.json  en.json   → header, menú, footer, tema, idioma, 404, botones genéricos
  home/              es.json  en.json
  calculator/        es.json  en.json   → página del desplegable (título, ayuda, "elegí una cuenta"…)
  formulas/
    waste-percentage/  es.json  en.json
    waste-factor/      es.json  en.json
    gross-quantity/    es.json  en.json
    clean-price/       es.json  en.json
    cooking-loss/      es.json  en.json
    recipe-costing/    es.json  en.json
    cost-of-goods/     es.json  en.json
    pricing/           es.json  en.json
    income-statement/  es.json  en.json
    break-even/        es.json  en.json
    omnes-rules/       es.json  en.json
    floor-area/        es.json  en.json
    rent-check/        es.json  en.json
  learn/
    waste-and-loss/    es.json  en.json
    …
```

Ejemplo de `formulas/cooking-loss/es.json`:

```jsonc
{
  "title": "Merma de cocción",
  "summary": "Cuánto peso pierde un alimento al cocinarse.",
  "explanation": ["La merma de cocción es…", "…"],
  "formula": "% Merma = Peso de la merma ÷ Peso antes de cocción × 100",
  "steps": ["Pesar la mercadería limpia…", "Cocinar…", "Pesar el producto cocido…"],
  "inputs": {
    "weight-before": {
      "label": "Peso antes de cocción",
      "placeholder": "Peso limpio + aderezos que no se pueden separar, en kg (ej.: 1,500)",
      "hint": "Incluí salsas, rebozados o rellenos que no se puedan separar.",
    },
    "cooked-weight": {
      "label": "Peso cocido",
      "placeholder": "Peso del producto ya cocido, en kg (ej.: 1,050)",
    },
  },
  "results": { "loss-weight": "Peso de la merma", "loss-percentage": "% de merma" },
  "study-notes": [
    {
      "type": "tip",
      "text": "La merma no es fija: depende del método, el equipo y el punto de cocción.",
    },
    { "type": "common-mistake", "text": "No confundir merma (cocción) con desecho (limpieza)." },
  ],
  "examples": [
    { "title": "…", "values": { "weight-before": 1.5, "cooked-weight": 1.05 }, "narrative": "…" },
  ],
}
```

- Cada carpeta se importa como JSON tipado en `src/i18n/translations.ts`: TypeScript exige que `en`
  tenga la forma de `es` (el español es el idioma fuente).
- `src/i18n/__tests__/translations.test.ts` recorre **todas** las carpetas automáticamente y exige: un
  archivo por idioma, las mismas claves en ambos (en las dos direcciones), claves y carpetas en
  kebab-case y ningún texto vacío. En F3/F4 se suma: cada input del registry tiene label y placeholder.
- Traductor propio `getTranslations(lang, namespace)` tipado, que funciona igual en `.astro` y en React. Las islas
  reciben ya resueltos solo los textos que usan (como props), así que no se manda i18next al cliente.
- Claves en kebab-case.
- **Placeholders:** cada input tiene un placeholder descriptivo que indica qué va, en qué unidad y
  con un valor de nuestro propio ejemplo. Además lleva `label` visible (el placeholder nunca lo
  reemplaza, por accesibilidad) y un `hint` opcional.
- Números con `Intl.NumberFormat` según idioma (`es-AR` → `1.234,56`; `en` → `1,234.56`). Los
  inputs aceptan coma o punto como separador decimal.

---

## 4. Rutas (iguales en ambos idiomas, siempre en inglés)

```
/                                  → redirect a /es (un script chico redirige a /en si el navegador está en inglés y no hay preferencia guardada)
/{es|en}                           → Home
/{es|en}/calculator                → Calculadora general con desplegable (?tool=cooking-loss)
/{es|en}/formulas                  → Índice de fórmulas
/{es|en}/formulas/{formula}        → Explicación + ejemplos resueltos + calculadora interactiva embebida
/{es|en}/learn/{topic}             → Secciones "Aprender"
404                                → localizado según el prefijo de la URL
```

- `getStaticPaths` genera cada ruta × cada idioma a partir del registry y de las carpetas de i18n.
- Cambiar de idioma conserva la ruta: `/es/formulas/cooking-loss` ↔ `/en/formulas/cooking-loss`.
- `<html lang>`, `<title>`, meta description, OG y `hreflang` (es/en/x-default) se generan por página.

---

## 5. Páginas

### Home

- Hero: logo + "Milimon" + bajada.
- **Card destacada → Calculadora** (fondo primario, texto marrón).
- Cards secundarias: Fórmulas y secciones de "Aprender" (`Card` de la lib, estático).

### Página de fórmula (`/formulas/{formula}`)

1. Qué es y para qué sirve (explicación basada en el manual, redactada con texto propio).
2. La fórmula (y sus variantes, p. ej. las dos fórmulas del factor de desecho).
3. Paso a paso.
4. **Ejemplos resueltos propios** (p. ej. salmón para 120 cubiertos, 25 % de desecho → 25,600 kg).
   Cada ejemplo tiene un botón "Probar este ejemplo" que carga los valores en la calculadora de abajo.
5. **Notas de estudio**: tips, errores comunes (por ejemplo, sumar el 30% en lugar de usar el
   factor de desecho: "nunca alcanza"), redondeos y las diferencias con el texto original del
   manual, explicadas.
6. **Calculadora interactiva** embebida (isla `client:visible`), con la misma lógica que la
   calculadora general. Muestra el desarrollo de la cuenta con los valores ingresados, no solo el resultado.
7. Links a fórmulas relacionadas y a la sección de "Aprender" correspondiente.

### Calculadora general (`/calculator`)

- **Desplegable** para elegir la cuenta ("¿Qué querés calcular?"), agrupado por tema: Desechos y
  mermas / Recetas / Precios / Resultados.
- Al elegir, se muestra la calculadora correspondiente (**los mismos componentes** que en las páginas
  de fórmula) con sus inputs, placeholders y resultados en vivo.
- La herramienta elegida queda en la URL (`?tool=`), así que se puede compartir y volver con el botón atrás.
- Los últimos valores de cada herramienta se guardan en `localStorage`.
- Link "¿Cómo se calcula?" hacia la página de la fórmula.

### Componentes de calculadora (reutilizables)

- `CalculatorForm` genérico, que se arma desde la definición del registry (inputs, validación, compute).
- `NumberField` (label + placeholder + hint + unidad + error), `ResultPanel`, `FormulaDisplay`.
- `RecipeCostingTable`: tabla editable de ingredientes (agregar/quitar filas), persistida en `localStorage`.
- Las islas son chicas y se cargan de forma diferida, una por herramienta.

---

## 6. Menú hamburguesa

Drawer lateral (isla React; accesible: `aria-expanded`, focus trap, cierre con Esc / click afuera
usando `useDismissableLayer` de la lib):

- Inicio
- Calculadora
- **Fórmulas**: lista expandible con un link directo por fórmula (acceso en un toque)
- Aprender
- Idioma ES / EN (componente `Language` de la lib)
- Tema claro / oscuro

La ui-library no tiene Header, Drawer, Accordion, Select ni Table. Se construyen en la app siguiendo
sus convenciones (cva + `cn` + tokens + tests) y, una vez estables, se suben a la lib como organisms.

---

## 7. Fórmulas a cubrir (según el manual)

Cada fórmula se escribe **una sola vez** en `src/utils/formulas` como función pura y se registra en
`registry.ts`. El registry alimenta el menú, las páginas, el desplegable y las validaciones de i18n.

| id                 | Herramienta                      | Fórmulas (manual)                                                                                                                                                                                                                                                                                                                                                    |
| ------------------ | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `waste-percentage` | % de desecho                     | desecho = bruto − neto; `%D = desecho / bruto × 100`                                                                                                                                                                                                                                                                                                                 |
| `waste-factor`     | Factor de desecho                | `FD = %D / (100 − %D) + 1`; alternativa `FD = bruto / neto`                                                                                                                                                                                                                                                                                                          |
| `gross-quantity`   | Cantidad bruta a comprar         | neto = personas × porción; `bruto = neto × FD` (y regla de tres); redondeo hacia arriba                                                                                                                                                                                                                                                                              |
| `clean-price`      | Precio limpio equivalente        | `PLE = precio bruto × FD` vs precio limpio del proveedor                                                                                                                                                                                                                                                                                                             |
| `cooking-loss`     | % merma de cocción               | antes de cocción (neto + aderezos inseparables) − cocido; `%M = merma / antes × 100`                                                                                                                                                                                                                                                                                 |
| `recipe-costing`   | Costeo de receta                 | ingrediente, UM, cantidad receta, %D, FD, `bruta = cant × FD`, precio compra, `costo = bruta × precio`; costo receta = Σ; costo porción = receta / rendimiento; incidencia %                                                                                                                                                                                         |
| `cost-of-goods`    | Costo de mercaderías consumidas  | `CMC = existencia inicial + compras − existencia final`                                                                                                                                                                                                                                                                                                              |
| `pricing`          | Coeficiente y precio             | costos no MP (sueldos, cargas sociales 48%, alquiler, servicios, gastos generales, amortización = inversión / 36); ganancia neta = inversión × %retorno / 12 + retiro; bruta = neta / (1 − 0,35); `coef = 1 + (costos no MP + ganancia bruta) / CMC`; precio neto = costo std × coef; `precio bruto = precio neto × (1 + Σ impuestos y cargos)` con desglose visible |
| `income-statement` | Cuadro de ganancias y pérdidas   | ingresos A&B − costo de venta − costo operativo = resultado antes de IG; IG 35%; resultado del ejercicio                                                                                                                                                                                                                                                             |
| `break-even`       | Punto de equilibrio              | tasa impuestos = VB / VN; tasa CV = CV / VN; TC = 1 − tasa CV; `PE = CF / TC`; ventas objetivo = (CF + **ganancia antes de impuestos**) / TC; ventas brutas = VN × tasa impuestos                                                                                                                                                                                    |
| `omnes-rules`      | Reglas de Omnes                  | proporcionalidad (máx ≤ 2–3 × mín); 3 zonas (rango / 3) y distribución 25/50/25; ticket promedio ±10% del promedio de la oferta; sugerencia del día en zona media                                                                                                                                                                                                    |
| `floor-area`       | Superficie del salón             | `m² = m² por cliente × (1 + 10–20 % circulación) × clientes`                                                                                                                                                                                                                                                                                                         |
| `seating-capacity` | Cubiertos que entran en un local | `cubiertos = m² local × 55 % / m² por cliente con circulación` (inversa de la anterior)                                                                                                                                                                                                                                                                              |
| `rent-check`       | Chequeo de alquiler              | alquiler / facturación neta ≤ 10% (óptimo 5%)                                                                                                                                                                                                                                                                                                                        |

Valores por defecto (del manual, editables): IVA 21%, IIBB 3%, tarjetas 5%, Seguridad e Higiene
0,5%, Ganancias 35%, cargas sociales 48%, retorno anual 32%, gastos generales 10%.

### Criterio ante diferencias

- Manual vs Excel → **manual** (p. ej. cargas sociales 48%, no 50%).
- Los tests reproducen los ejemplos del manual con sus mismos datos. Cuando el manual redondea un
  paso intermedio (0,700 / 2,400 = 29,17% → "30%"; TC 0,66; coef 2,895), la explicación muestra el
  redondeo de forma explícita ("≈ 30%"). La calculadora calcula con precisión completa y redondea solo
  al mostrar.

**Impuestos del precio de carta: se muestra el desglose.**

- Cada componente es un input editable: IVA 21% + IIBB 3% + comisión de tarjetas 5% + Seguridad e
  Higiene 0,5% = **29,5%** → factor 1,295. El total y el factor se recalculan en vivo.
- Nota de estudio: el manual escribe "24,5%" y usa el factor 1,245, que es la suma **sin** la
  comisión de tarjetas (21 + 3 + 0,5). La nota lo explica, y el ejemplo de las medialunas se muestra
  de las dos formas: 24,5% (sin tarjetas, tal cual el manual) y 29,5% (con todos los componentes).
- Switch "¿Cobrás con tarjeta?" que suma o quita la comisión del total.

**Punto de equilibrio con ganancia: se usa la ganancia antes de impuestos.**

- Ventas netas objetivo = (CF + ganancia **antes** de impuestos) / TC =
  (313.977 + 200.000) / 0,66 ≈ **$ 778.753** (el manual usa los $ 130.000 netos y obtiene $ 672.692).
- La explicación va paso a paso: por qué la ganancia deseada tiene que cubrir el impuesto a las
  ganancias (130.000 / (1 − 0,35) = 200.000), qué pasa si se usa la neta (te quedás corto), y
  cómo se pasa de ventas netas a brutas (× 1,42).

### Secciones "Aprender" (`/learn/{topic}`)

Solo contenido vinculado a la calculadora y a la administración del restaurante:

- `purchasing-and-receiving`: planificación de compras, orden de compra y controles de recepción
  (cantidades, unidades, calidad, temperatura, desechos, factura)
- `storage`: almacenamiento de secos, refrigerados y congelados, PEPS y decomiso
- `waste-and-loss`: desechos, mermas, desperdicios, decomiso y residuos (esquema bruto → neto → cocido)
- `waste-criteria`: criterio conservador vs criterio empresario
- `standard-recipes`: recetario estandarizado, costeo y ajuste de contenido
- `stock-control`: inventarios, CMC y faltantes
- `cost-classification`: elementos del costo (materia prima, mano de obra, cargas sociales,
  impuestos, gastos generales), costos no relacionados con la materia prima, amortizaciones
- `pricing`: fijación de precios (ganancia deseada, coeficiente, precio teórico vs competencia)
- `cost-structure`: costos fijos, variables, cuadro de resultados, contribución marginal y punto de equilibrio
- `menu-balance`: reglas de Omnes y estrategia de precios en la carta
- `premises-layout`: superficie del salón y cocina, alquiler vs facturación

Fuera de alcance: descriptivos de puesto, selección, capacitación y motivación (RRHH), marketing,
segmentación, producto gastronómico y comunicación.

Texto propio basado en el manual, no copiado literal.

---

## 8. Configuración y moneda

- Panel de **Configuración** (en el menú hamburguesa): moneda, formato de números, tema e idioma.
- **Moneda por defecto: pesos argentinos (ARS, `$`)**, configurable (USD, EUR, MXN, CLP, UYU…).
  Solo cambia cómo se muestran los montos (`Intl.NumberFormat` con `style: 'currency'`); no se
  hacen conversiones de tipo de cambio.
- Formato de números: por defecto según el idioma (`es-AR` / `en-US`), configurable por separado de
  la moneda (por ejemplo, inglés con pesos).
- Se guarda en `localStorage` hasta que exista el login (§10).
- **Capa de persistencia desacoplada desde el día uno:** ninguna calculadora usa `localStorage`
  directo. Todo pasa por los stores de zustand (`useSettingsStore`, `useDraftsStore`,
  `useHistoryStore`), persistidos en `localStorage`; la sincronización de cuentas se suscribe a
  ellos, así que las calculadoras no saben nada del backend.

---

## 9. Analytics y compartir (F8) — hecho

> Implementado: `services/google-analytics` (Consent Mode v2, script solo tras aceptar),
> `ConsentBanner`, página `/[lang]/privacy` con el interruptor `AnalyticsPreference`, imágenes
> `public/og/og-<sección>-<idioma>.png` (inicio, administración, recetas, blog) generadas con `pnpm og:image` y card `summary_large_image`.
> Queda por hacer fuera del código: crear la propiedad GA4, cargar el ID en el hosting y probar la
> vista previa en WhatsApp, LinkedIn y el Sharing Debugger de Facebook.

- Desde el día uno existe `utils/analytics.ts` con un `track(event, props)`. Las calculadoras ya lo
  llaman (`tool_selected`, `calculation_completed`, `example_loaded`, `calculator_reset`,
  `language_changed`, `theme_changed`, `currency_changed`, `menu_opened`), así que solo hay que
  conectar el proveedor.
- **Proveedor: Google Analytics 4** (pedido del proyecto), con el ID en `PUBLIC_GA_MEASUREMENT_ID`.
  Sin ese ID no se carga nada.
- GA4 usa cookies → **banner de consentimiento** (reutilizando la idea del componente `Cookies` de
  zamuner) y **Consent Mode v2**: el script no se carga hasta que la persona acepta; si rechaza, no hay medición.
  La elección se guarda en el repositorio de configuración.
- Eventos útiles para decidir: qué calculadoras se usan, cuántas cuentas se completan, qué ejemplos
  se cargan, idioma, tema y moneda.

### Compartir en redes (Open Graph)

- Ya hay Open Graph básico en todas las páginas (título, descripción, imagen del logo, idioma) e
  íconos de ventana: favicon, apple-touch, android y manifest.
- [x] Imagen para compartir de 1200 × 630 con la marca, una por sección
      (`og-{home,management,recipes,blog}-{es,en}.png`, generadas con `scripts/og-image.mjs`).
- [x] Card `summary_large_image` de X/Twitter.
- [ ] Probar la vista previa en WhatsApp, LinkedIn y Facebook (este último con su Sharing Debugger).

---

## 9 bis. Monetización (a evaluar, sin implementar)

Ideas para discutir, ordenadas de menor a mayor impacto en la experiencia:

| Opción                          | Cómo sería                                                                                                         | A favor                                            | En contra                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------ |
| Donaciones                      | Botón de Cafecito / Mercado Pago / Ko-fi en el footer                                                              | Nada invasivo, se suma en minutos                  | Ingresos bajos e irregulares                                       |
| Afiliados                       | Links a balanzas, termómetros o libros recomendados en el contenido de estudio                                     | Relevante para el tema                             | Hay que cuidar que no parezca publicidad encubierta                |
| Plan premium (con cuentas, F10) | Gratis: todas las fórmulas. Premium: recetas ilimitadas guardadas, exportar a PDF/Excel, varios locales, historial | Aprovecha el login; valor claro para profesionales | Requiere cobros (Mercado Pago / Stripe) y soporte                  |
| Licencias educativas            | Versión para escuelas de gastronomía (el contenido nace de un manual de curso) con cuentas por curso               | Público natural del producto                       | Venta B2B, más lenta                                               |
| Publicidad (AdSense)            | Anuncios en páginas de estudio                                                                                     | Pasivo                                             | Paga poco con este tráfico, ensucia la marca y pide consentimiento |

Recomendación inicial: arrancar con donaciones y medir con GA4 qué se usa. Si hay tracción, evaluar
el plan premium sobre las cuentas de F10.

---

## 10. Cuentas y perfiles (fase final) — hecho

> Implementado con una API propia en otro repositorio ([ADR 0004](adr/0004-accounts-api.md)):
> [milimon-backend-nest](https://github.com/inzumer/milimon-backend-nest) (NestJS + PostgreSQL), login
> con Google Identity Services y Facebook Login, sincronización offline-first, páginas `/login` y
> `/account`, términos, privacidad con instrucciones de borrado. Configuración en
> [ACCOUNTS.md](ACCOUNTS.md). (La primera versión con Supabase, ADR 0003, quedó reemplazada.)

Objetivo: que cualquier persona, en cualquier país, guarde su configuración (moneda, formato,
idioma, tema), sus recetas y sus cálculos en un perfil propio.

- **Login con Google y Facebook** (OAuth), con un botón "Iniciar sesión" en la home y en el header/menú.
- **La app sigue funcionando sin cuenta** (modo invitado con `localStorage`). Al iniciar sesión por
  primera vez se ofrece migrar lo guardado localmente al perfil.
- Backend en su propio repo, con las convenciones de `api-zamuner`: NestJS + PostgreSQL + TypeORM,
  en Render (gratis) con la base en Neon (gratis). El front sigue siendo estático.
- Tablas iniciales: `profiles` (moneda, locale, idioma, tema), `recipes` (+ ingredientes),
  `saved_calculations` (herramienta, inputs, fecha).
- Requisitos que hay que prever:
  - Páginas de **política de privacidad** y **términos** en es/en (obligatorias para los proveedores OAuth).
  - Facebook/Meta exige revisión de la app y una **URL o instrucciones de eliminación de datos**.
  - Opción de borrar la cuenta desde el perfil.
  - Configurar los dominios de redirect en Google Cloud y Meta for Developers.

---

## 10 bis. Historial de cálculos — hecho

- Botón **"Guardar en el historial"** debajo del resultado de cada calculadora (explícito: guardar
  en cada tecla llenaría el historial de cuentas a medio hacer). Guardar dos veces lo mismo seguido
  no se puede: el botón pasa a "Guardado" hasta que cambie algún dato.
- Se guarda **la cuenta entera**: lo que se cargó (tal cual se escribió), el resultado completo y el
  desarrollo paso a paso. Es una foto: si una fórmula cambia más adelante, el historial sigue
  mostrando lo que se calculó en su momento.
- **Hasta 15 cálculos**; al guardar el 16.º se descarta el más viejo. El límite se aplica en el
  cliente (`HISTORY_LIMIT`) y en la base (trigger).
- Funciona **sin cuenta** (`localStorage`) y se sincroniza con la cuenta igual que la
  configuración (tabla `history_entry` en la API).
- Página `/[lang]/history` (en el menú): fecha, fórmula y resultado principal; "Ver la cuenta
  completa" la muestra con los mismos componentes que la calculadora; "Abrir en la calculadora"
  recarga los valores; "Borrar".

## 10 ter. Secciones: administración, recetas y blog (separadas)

- El sitio se divide en tres secciones, en el inicio y en el menú: **Administración gastronómica**
  (calculadora, fórmulas, aprender, historial), **Recetas** y **Blog**.
- Todas las páginas públicas terminan con "Compartí esta página" (hoja de compartir del dispositivo,
  WhatsApp, Facebook, X, LinkedIn, email y copiar enlace), con evento `page_shared`.
- **Blog** (`/blog`, `/blog/{artículo}`): primer artículo, los _milicitos_ (escala de 1 a 5
  estrellitas para puntuar lo que probamos). Hasta que exista el CMS, los artículos viven en
  `src/i18n/blog/{es,en}.json` y se listan en `BLOG_ARTICLE_IDS`.
- **Recetas** (`/recipes`): página "Próximamente" con la imagen de la estrella.
- Cada sección tiene su imagen para compartir (`og-{home,management,recipes,blog}-{es,en}.png`).

### Pendientes

Ideas y análisis de cada tema en [docs/suggestions](./suggestions/README.md) (también en el sitio,
en **Gestión del sitio → Sugerencias**, solo para editores y admins).

**Para lanzar**

- [ ] **Publicar la gestión del sitio**: commits listos en `feature/publishing-agenda` (API) y
      `feature/admin-tools` (front), sin fusionar. Falta: `--no-ff` a `dev`, `release/1.2.0` (API)
      y `release/1.17.0` (front) a `main` con tag, y push. Primero la API: la agenda del front la usa.

- [ ] **Deploy oficial con dominio propio** (Cloudflare Pages o similar) y **auditoría de seguridad**:
      cabeceras HTTP, escaneos externos, revisión de la API y aviso legal (RGPD/LSSI). Ver
      [01](./suggestions/01-deploy-y-seguridad.md).
- [ ] **API en Render**: crear el servicio desde el Blueprint con el `DATABASE_URL` de Neon y
      `BOOTSTRAP_ADMIN_EMAILS` con los emails de Milagros y del admin técnico. **Es lo que falta para que
      funcione el inicio de sesión con Google** (28/09: el dominio de la API en Render responde
      `no-server`; la base en Neon ya está creada y las migraciones nuevas corren al arrancar).
- [ ] **Google Cloud**: orígenes autorizados (`https://inzumer.github.io` hoy, el dominio propio después).
- [ ] **Search Console y Bing Webmaster Tools**: verificar el sitio y enviar el sitemap.
- [ ] **Google Tag Manager**: contenedor + `PUBLIC_GTM_ID` (activa el banner de cookies). Ver
      [04](./suggestions/04-medicion-y-cuentas.md).
- [ ] **Meta (Facebook Login)**: crear la app cuando Meta lo permita; hasta entonces el botón queda
      deshabilitado con el aviso "Próximamente".

**Gestión del sitio**

- [x] **Roles** (`user`, `editor`, `admin`) y sección **Administración** con usuarios, roles y
      registro de cambios (API 1.1.0, front 1.16.0).
- [x] **Menú "Gestión del sitio"** solo para editores y admins: panel, agenda, guía de fotos y
      sugerencias (desplegable con los 11 documentos de `docs/suggestions`).
- [x] **Zócalo "Modo gestión"** debajo del header con el rol de quien navega; nadie más lo ve.
- [x] **Agenda de publicaciones** editable y compartida (recetas, reseñas, guías, artículos y
      redes, con estado), guardada en la base (`/admin/agenda`, API 1.2.0).
- [ ] **Keystatic con vista previa y acceso solo admin**: falta sesión en cookie y middleware en
      `/keystatic` con el deploy en Cloudflare Pages; vista previa por rama de borrador. Ver
      [02](./suggestions/02-cms-y-emails.md#keystatic-vista-previa-y-acceso-solo-para-admins).

**Contenido**

- [ ] **CMS sin dependencia técnica** para que Milagros gestione recetas, blog, guías, "Sobre mí",
      textos del inicio y secciones nuevas (recomendado: Keystatic + Keystatic Cloud), migrando los
      textos que hoy están en `src/i18n`; **emails** a suscriptores (RSS a email). Ver
      [02](./suggestions/02-cms-y-emails.md).
- [ ] Revisión del texto de "Sobre mí" por Milagros.
- [ ] Comparar el texto explicativo con el material del curso (hace falta el PDF) para confirmar que
      no quedó ninguna frase igual.
- [ ] **Emails transaccionales** (bienvenida al registrarse, confirmación al eliminar la cuenta) con
      un paquete `@inzumer/email` (React Email + tokens) y envío desde la API. Ver
      [10](./suggestions/10-emails-transaccionales.md).
- [ ] **Recetas con UI de referencia** (Pinterest): cards verticales con imagen y degradado, botones
      flotantes, carrusel, chips de filtro, ficha de receta con modo "Empezar a cocinar"; isotipo
      nuevo. Ver [09](./suggestions/09-direccion-visual.md).
- [ ] **Fotografía**: aplicar la [guía de fotografía](./suggestions/11-guia-de-fotografia.md) (luz,
      ángulos, distancia y foco, fondos, formatos, edición) y armar un preset de edición común.

**Diseño**

- [x] **Paleta de la referencia**: escala **terracota** (`--color-accent-*`) para enlaces, acentos
      y el zócalo de gestión; los botones y destacados usan el color principal. Crema más cálido en
      las superficies y chocolate de la referencia en el modo oscuro. Contraste AA medido en los dos
      modos.
- [x] **Naranja como color principal** (28/09): la escala `--color-primary-*` pasa del amarillo al
      naranja de la referencia (`#F29A3E`) en botones, etiquetas, tarjetas destacadas y focos; también
      el color del manifest y las imágenes para compartir. Auditoría a11y sin errores en 102 páginas.
- [ ] **Ilustraciones en naranja**: el logo y la estrella de los milicitos siguen con fondo amarillo
      (son imágenes). Decidir si Milagros las pasa a naranja o se hace el isotipo nuevo.
- [x] **Preferencias del menú**: solo idioma y modo oscuro, cada uno con una aclaración corta; la
      **moneda** pasó a **Configuración** en "Tu cuenta".
- [ ] **Dirección visual** más fina y editorial (inicio tipo portada, cards con imagen,
      tipografía), conservando la ilustración y los milicitos. Ver
      [09](./suggestions/09-direccion-visual.md) y animaciones en [06](./suggestions/06-animaciones.md).

**Técnico**

- [x] Renombrar las carpetas locales (`milimon`, `api-milimon`).
- [ ] **Repositorios `milimon-<área>-<tecnología>`** (detalle en
      [08](./suggestions/08-calidad-y-tests.md#repositorios-y-paquetes-decidido-2026-09-27)):
  - [x] `api-milimon` → **`milimon-backend-nest`** (28/09): repo, paquete, servicio de Render y
        emisor de los tokens.
  - [ ] `milimon` → **`milimon-frontend-web`**: `BASE_PATH` ya sale del nombre del repo (hotfix #14);
        falta fusionarlo a `main`, renombrar y lanzar el deploy de Pages.
  - [ ] Carpetas locales y remotes con los nombres nuevos.
- [x] `.gitattributes` en `ui-library` (finales de línea).
- [ ] **Cookies en un solo componente**: `CookieConsent` (modos `banner`, `modal` e `inline`) en
      `@inzumer/ui-library` 2.0.0 ([ui-library #29](https://github.com/inzumer/ui-library/pull/29)).
      Cuando se publique, migrar `ConsentBanner` y `AnalyticsPreference` del sitio.
- [ ] **Librería de componentes**: `Carousel` accesible y `MediaCard` (card con imagen, degradado y
      acciones flotantes) en `@inzumer/ui-library`.
- [ ] **`milimon-e2e`**: tests e2e con Playwright y la auditoría a11y (hoy
      `scripts/a11y-audit.mjs`) y las revisiones de SEO (title, description, canonical, hreflang,
      JSON-LD, sitemap, robots, imágenes para compartir) y rendimiento (Lighthouse) en su propio
      repo, llamados desde las Actions de cada proyecto; lo genérico, en `inzumer-ci`.
      `scripts/og-image.mjs` no es un test: queda en el front como herramienta del build. Ver
      [08](./suggestions/08-calidad-y-tests.md).
- [x] **Releases automáticos**: el viernes al mediodía (Madrid) se arma el PR de release y el lunes
      al mediodía se fusiona, con tag, GitHub Release, backport automático a `dev` y deploy; si no hay
      cambios, se cierran solos. Los workflows son los reutilizables de
      [`inzumer-ci`](https://github.com/inzumer/inzumer-ci) (`@v1`), compartidos con los demás repos.
      Dependabot abre PRs los días 1 y 15. Ver
      [08](./suggestions/08-calidad-y-tests.md#releases-automáticos).
- [x] **Sitio de documentación**: [`inzumer/milimon-docs`](https://github.com/inzumer/milimon-docs),
      publicado en https://inzumer.github.io/milimon-docs/ (Starlight): arquitectura, 9 flujos con
      diagramas, guía de gestión, desarrollo, y el plan y las sugerencias sincronizados desde `docs/`.
- [ ] Pasar la documentación a `docs.<dominio>` con el deploy oficial y enlazarla desde **Gestión del
      sitio**. Ver [12](./suggestions/12-sitio-de-documentacion.md).
- [ ] **Un repo `inzumer-<nombre>` por paquete, publicado como `@inzumer/<nombre>`** (hoy todos
      viven en el monorepo `ui-library`):
  - [x] `inzumer-tsconfig`, `inzumer-prettier` e `inzumer-eslint` creados (28/09, con su historia);
        falta el secret `NPM_TOKEN` en cada uno para publicar la 1.0.0.
  - [x] `inzumer-ci` con los workflows reutilizables (CI, release de paquetes y release semanal).
  - [ ] `inzumer-ui-tokens` (`@inzumer/ui-tokens`) e `inzumer-ui-lib` (`@inzumer/ui-lib`), cuando
        estén publicadas las configs; después, deprecar los nombres viejos en npm.
  - Orden y detalle en
    [08](./suggestions/08-calidad-y-tests.md#repositorios-y-paquetes-decidido-2026-09-27).

## 11. Fases

Cada fase termina con `astro check` + lint + test:coverage en verde y un PR con Conventional Commits.

**Estado (2026-09-26):** todas las fases (F0 a F10, más el historial de F10 bis) están terminadas. v1.0.0 salió a `main` con las cuentas; F9 (ui-library 1.2.0 y 1.3.0) va en v1.1.0.

Flujo de ramas (gitflow, ver CLAUDE.md): cada fase se trabaja en `feature/*` desde `dev` y se mergea a
`dev`. El primer release a `main` se hace al terminar F10 (cuentas/login).

| Fase                           | Entregable                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **F0 · Setup**                 | `git init`, Astro + React + TS estricto, Tailwind + preset, aliases, ESLint/Prettier (+ plugins astro), cspell con diccionario español, Vitest 90%, CLAUDE.md, `.claude/`, PR template, CI, `.nvmrc`, README                                                                                                                                                 |
| **F1 · Tema + shell**          | tokens Milimon claro/oscuro, script anti-parpadeo, fuentes self-hosted, layout mobile-first/centrado ≥1024, Header + Drawer hamburguesa, toggles de idioma y tema, Footer, rutas `[lang]`, redirect raíz, 404, traductor tipado + tests de paridad de i18n                                                                                                   |
| **F2 · Dominio**               | fórmulas puras con tests usando los ejemplos del manual (100% de cobertura en `utils/formulas`), parseo/formato de números y moneda, registry, repositorios de persistencia (`local`)                                                                                                                                                                        |
| **F3 · Calculadoras**          | `NumberField`, `CalculatorForm`, `ResultPanel` con desarrollo de la cuenta, `Select`, una isla por herramienta, `RecipeCostingTable`, panel de configuración (moneda)                                                                                                                                                                                        |
| **F4 · Páginas de fórmulas**   | índice + detalle con explicación, ejemplos del manual, notas de estudio, "Probar este ejemplo" y calculadora embebida; traducciones es/en de cada carpeta                                                                                                                                                                                                    |
| **F5 · Calculadora general**   | página con desplegable, `?tool=`, links a la explicación                                                                                                                                                                                                                                                                                                     |
| **F6 · Aprender**              | secciones explicativas es/en con links cruzados                                                                                                                                                                                                                                                                                                              |
| **F7 · Pulido**                | meta/OG/hreflang, sitemap, favicon desde el logo (hoy el PNG pesa 1,6 MB → `astro:assets` a WebP/AVIF), auditoría a11y en ambos temas, Lighthouse, deploy                                                                                                                                                                                                    |
| **F8 · Analytics y compartir** | GA4 con banner de consentimiento y Consent Mode v2, imágenes Open Graph 1200 × 630, card grande de X                                                                                                                                                                                                                                                         |
| **F9 · Upstream**              | subir a ui-library los componentes genéricos con changeset — **hecho**: 1.2.0 (`Select`, `Textarea`, `Drawer`, `useFocusTrap`, `useScrollLock`, foco atrapado en `Modal`/`BottomSheet`) y 1.3.0 (`Accordion`, `Table`). `NumberField` queda en la app (parseo decimal según idioma y unidad en la etiqueta: es lógica de dominio; lo genérico ya es `Input`) |
| **F10 · Cuentas**              | login Google/Facebook, perfiles, repositorios `remote`, migración desde localStorage, privacidad/términos, borrado de cuenta                                                                                                                                                                                                                                 |

---

## 12. Decisiones tomadas

- Astro estático + islas de React; rutas en inglés, iguales en ambos idiomas.
- Traducciones en carpetas kebab-case por fórmula/sección.
- Modo claro y oscuro.
- Manual por sobre el Excel; tono de manual de estudio.
- Impuestos del precio de carta con desglose visible (29,5% con tarjetas; se explica el 24,5% del manual).
- Punto de equilibrio con ganancia antes de impuestos, explicado paso a paso.
- Alcance: calculadora + administración del restaurante; sin RRHH, marketing ni comunicación.
- Pesos por defecto, moneda configurable; `localStorage` hasta la fase de cuentas.
- Cuentas con Google/Facebook en la fase final (F10).
- Repositorios con el nombre `milimon-<área>-<tecnología>` (`milimon-frontend-web`,
  `milimon-backend-nest`, `milimon-e2e-playwright`, `milimon-emails-react`, `milimon-cms-keystatic`);
  los paquetes compartidos, `inzumer-<nombre>` publicados como `@inzumer/<nombre>`.
