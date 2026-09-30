# ADR 0005 · Datos de la API con TanStack Query

- **Estado:** aceptada
- **Fecha:** 2026-09-29

## Contexto

Las secciones de gestión (administración y agenda) pedían sus datos a la API con `useEffect` y
`useState`, cada isla por su cuenta. Había banderas de "recargar", estados de carga y de error
repetidos, y la comprobación de acceso (`GET /me`) se hacía una vez por cada isla de la página.
A medida que crezcan las secciones con datos de la API (recetas guardadas, más gestión), eso escala mal.

## Decisión

- **`@tanstack/react-query`** para los datos que vienen de la API. Zustand sigue siendo el estado
  local persistido: preferencias, valores de las calculadoras e historial, sincronizados por
  `services/account`.
- **Un solo `QueryClient` por página** (`getQueryClient()` en `@services/query`), compartido por todas
  las islas: cada isla es su propia raíz de React y se envuelve en el átomo `QueryProvider`.
- **Claves en un solo lugar** (`queryKeys`). Las mutaciones invalidan el grupo completo (`agendaAll`,
  `adminAll`).
- **Sin reintentos en las queries**: `requestJson` ya reintenta las fallas transitorias (ADR 0004).
  El tiempo de frescura está en `QUERY_STALE_TIME_MS` (`src/constants/api.ts`).
- **Tests**: `resetQueryClient()` en `src/test/setup.ts` después de cada test.

## Consecuencias

- `useAdminAccess`, `AgendaPanel` y `AdminPanel` usan `useQuery`/`useMutation`. La consulta de
  acceso se hace una sola vez por página, aunque haya varias islas.
- Las próximas secciones con datos de la API siguen este patrón en lugar de `useEffect`.
- Suma una dependencia al JavaScript de las islas; conviene revisar su peso en el build si se
  extiende a islas de páginas públicas.
