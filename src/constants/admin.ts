/** Internal suggestion docs in menu order: English route slug → file in `docs/suggestions`. */
export const ADMIN_DOCS = [
  { id: 'deploy-and-security', file: '01-deploy-y-seguridad' },
  { id: 'cms-and-emails', file: '02-cms-y-emails' },
  { id: 'content-and-social', file: '03-contenido-y-redes' },
  { id: 'analytics-and-accounts', file: '04-medicion-y-cuentas' },
  { id: 'monetization', file: '05-monetizacion' },
  { id: 'animations', file: '06-animaciones' },
  { id: 'optimization', file: '07-optimizacion' },
  { id: 'quality-and-tests', file: '08-calidad-y-tests' },
  { id: 'visual-direction', file: '09-direccion-visual' },
  { id: 'transactional-emails', file: '10-emails-transaccionales' },
  { id: 'photo-guide', file: '11-guia-de-fotografia' },
  { id: 'docs-site', file: '12-sitio-de-documentacion' },
] as const;

export type AdminDocId = (typeof ADMIN_DOCS)[number]['id'];

/** Where links from those documents to the rest of `docs/` point (not published on the site). */
export const DOCS_REPO_URL = 'https://github.com/inzumer/milimon-frontend-web/blob/dev/docs';

/** Publishing agenda: kinds of pieces and their states (same values as the API). */
export const AGENDA_KINDS = ['recipe', 'review', 'guide', 'article', 'social'] as const;
export type AgendaKind = (typeof AGENDA_KINDS)[number];
export const AGENDA_STATUSES = ['planned', 'in-progress', 'published'] as const;
export type AgendaStatus = (typeof AGENDA_STATUSES)[number];

/** Agenda text limits (same as the API). */
export const AGENDA_TITLE_MAX_LENGTH = 160;
export const AGENDA_NOTES_MAX_LENGTH = 1000;
