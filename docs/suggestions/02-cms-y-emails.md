# 02 · CMS y emails

Objetivo: que **Milagros cargue y edite el contenido sola, sin depender de nadie técnico**
(recetas, blog, guías, "Sobre mí", textos del inicio y secciones nuevas), y que quienes se
suscriban reciban un aviso cuando hay contenido nuevo.

## Requisitos para que no haya dependencia técnica

- Entrar con **email o Google** (sin cuenta de GitHub ni nada de código).
- **Editor visual**: textos con formato, fotos que se suben desde el celular, vista previa.
- **Publicar con un botón**: el sitio se reconstruye y se publica solo en un par de minutos.
- **Plantillas** para cada tipo (receta, artículo, guía, sección) con los campos ya armados.
- Español e inglés en el mismo formulario, con aviso si falta una traducción.
- Una **guía corta de uso** (con capturas) y la configuración hecha una sola vez por el equipo técnico.

## Alternativas gratuitas

| CMS                             | Tipo                                | Costo                      | ¿Sin dependencia técnica?                               | Notas                                                  |
| ------------------------------- | ----------------------------------- | -------------------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| **Keystatic + Keystatic Cloud** | Git (el contenido queda en el repo) | Gratis para equipos chicos | Sí: login con email, editor visual, imágenes en su nube | Integración oficial con Astro; el sitio sigue estático |
| **Sanity**                      | Headless en la nube                 | Plan gratuito amplio       | Sí: login con Google/email, estudio web muy completo    | Contenido fuera del repo; rebuild por webhook          |
| TinaCMS                         | Git + nube                          | Gratis hasta 2 usuarios    | Sí, con edición visual sobre la página                  | Depende de su servicio                                 |
| Storyblok / Contentful          | Headless en la nube                 | Gratis con límites         | Sí, editor visual                                       | Límites de usuarios y cuotas                           |
| Decap CMS / Pages CMS           | Git                                 | Gratis                     | No del todo: piden cuenta de GitHub                     | Buenos para editores técnicos                          |
| Strapi / Payload                | Autoalojado                         | Gratis, con servidor       | Sí, pero hay que mantener el servidor                   | Más mantenimiento                                      |

**Costo cero:** no vamos a pagar por un CMS. Todas las opciones recomendadas se usan dentro de su
plan gratuito, y el contenido queda en nuestro repo, así que cambiar de herramienta no implica
perder nada.

**Recomendación:** **Keystatic con Keystatic Cloud** en su plan gratuito: Milagros entra con su
email, el contenido queda versionado en el repo (se puede volver atrás), cada publicación dispara el
deploy que ya existe y no suma servidores. Si algún día se superaran los límites del plan gratuito,
la salida también es gratis: **Keystatic en modo GitHub** o **Decap CMS** con el inicio de sesión
resuelto por nuestra propia API (sin costo, a cambio de que la editora tenga una cuenta de GitHub),
o **Sanity** en su plan gratuito.

## Keystatic: vista previa y acceso solo para admins

Decisión: **Keystatic** (revisado y aprobado), con dos requisitos: que quien administra vea cómo va
a quedar el contenido antes de publicarlo, y que el editor solo sea accesible para **perfiles con
rol admin** de las cuentas de Milimon.

### Dónde vive el editor

El editor de Keystatic se sirve en el propio sitio (`/keystatic`) y necesita unas rutas de
servidor (`/api/keystatic`). Hoy el sitio es 100 % estático en GitHub Pages, que no ejecuta código
de servidor. En **Cloudflare Pages** (el hosting propuesto en [01](./01-deploy-y-seguridad.md)) se
resuelve con el adaptador `@astrojs/cloudflare`: todo sigue estático y **solo** `/keystatic` y
`/api/keystatic` corren como funciones (dentro del plan gratuito). Por eso el CMS llega junto con el
deploy oficial.

### Acceso solo para admins

1. **Rol en las cuentas** (`milimon-backend-nest`): columna `role` (`user` | `admin`) en el usuario, incluida
   en el token y en `/me`; los admins se asignan a mano (Milagros y el equipo técnico). Esto se
   puede adelantar ya.
2. **Sesión en cookie**: en el dominio propio, la sesión pasa a una cookie `HttpOnly`, `Secure`,
   `SameSite` (también es una mejora de seguridad, ver [01](./01-deploy-y-seguridad.md)), así el
   servidor puede leerla.
3. **Tokens verificables sin secreto**: la API firma los tokens con clave asimétrica (EdDSA o RS256)
   y publica la clave pública; el sitio verifica el token sin conocer ningún secreto.
4. **Middleware de Astro** en `/keystatic` y `/api/keystatic`: sin sesión redirige al login; con
   sesión pero sin rol admin, responde 403. Nadie más ve ni el editor ni su API.
5. **Segunda llave del lado del contenido**: Keystatic Cloud (o GitHub) solo acepta a las mismas
   personas invitadas; aunque alguien saltara el middleware, no podría guardar cambios.
6. En el menú de la cuenta, un enlace "Administrar contenido" visible solo para admins.

### Vista previa antes de publicar

- Cada cambio se guarda primero en una **rama de borrador** (Keystatic trabaja con ramas).
- Cloudflare Pages crea una **URL de vista previa por rama** automáticamente: el mismo sitio, con el
  contenido nuevo, en una dirección privada (`borrador-….milimon.pages.dev`).
- En Keystatic se configura `previewUrl` para que cada entrada tenga el botón **"Ver vista previa"**
  que abre esa URL en la página exacta (la receta, el artículo).
- Las vistas previas llevan `noindex` y el mismo control de acceso que el editor.
- **Publicar** = fusionar el borrador: el deploy de producción sale solo.
- Mientras se escribe, el editor muestra una vista previa rápida del texto con los estilos del sitio.

Hoy los textos viven en `src/i18n/<carpeta>/{es,en}.json`. El plan es mover al CMS **las mismas
estructuras**, para que la migración sea un script y las páginas no cambien de diseño.

| Hoy (en el código)           | En el CMS                                                                                                              | Tipo            |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------- |
| `about-page` (Sobre mí)      | "Sobre mí": intro, estudios, por qué la web                                                                            | Página única    |
| `home` (textos del inicio)   | "Inicio": subtítulo, títulos y bajadas de cada sección, cards                                                          | Página única    |
| `blog` (artículos)           | "Artículos": título, fecha, portada, cuerpo, milicitos, categoría                                                      | Colección       |
| `coming-soon` (Recetas)      | "Recetas": ver el modelo abajo                                                                                         | Colección       |
| —                            | "Guías" (estilo La Tiendita di)                                                                                        | Colección nueva |
| `privacy-page`, `terms-page` | "Legales"                                                                                                              | Páginas únicas  |
| `common` (footer, menú)      | "Sitio": textos del pie, redes, enlaces del menú                                                                       | Página única    |
| **Secciones nuevas**         | "Páginas": título, URL y **bloques** (texto, imagen, galería, cards, llamada a la acción, receta o artículo destacado) | Colección       |

Lo que está atado a las calculadoras (fórmulas, "Aprender", textos de la calculadora) conviene
dejarlo en el código por ahora: sus textos dependen de la lógica y de los tests.

**Pasos**

1. Definir las colecciones del CMS con los mismos campos que los JSON actuales.
2. Script de migración: lee `src/i18n/*` y crea las entradas del CMS en es/en.
3. Las páginas leen del CMS (Astro Content Layer) con los JSON como respaldo mientras se prueba.
4. Menú y sitemap se generan a partir de las colecciones: una sección nueva aparece sola en el
   menú, en el sitemap y con sus datos estructurados.
5. Previsualización en una rama de borrador antes de publicar.

## Animaciones en el contenido dinámico

Los bloques del CMS usan las animaciones de [06 · Animaciones](./06-animaciones.md): cada bloque
puede tener una entrada suave al aparecer (opción "animar al entrar" en el editor), y las cards,
galerías y milicitos ya traen las suyas. Así lo que cargue Milagros se ve igual de cuidado que lo
que hoy está en el código.

## Modelo de contenido

- **Receta**: título, portada y galería, porciones, tiempo, dificultad, ingredientes (cantidad,
  unidad, % de desecho → se reutiliza la calculadora de costeo), pasos, costo por porción,
  milicitos, etiquetas, versión imprimible y datos estructurados `Recipe`.
- **Artículo**: título, portada, fecha, categoría (reseñas, técnicas, viajes, administración),
  cuerpo con bloques propios (puntaje en milicitos, receta relacionada, galería).
- **Guía**: tema o destino, portada, índice, secciones con fotos, lugares con dirección y mapa,
  consejos y enlaces.

## Emails a suscriptores

Sin backend nuevo: el sitio publica un **RSS** (`@astrojs/rss`) y un servicio de email envía
automáticamente cada entrada nueva ("RSS to email").

| Servicio       | Plan gratuito (aprox.) | Notas                                                  |
| -------------- | ---------------------- | ------------------------------------------------------ |
| **MailerLite** | ~1.000 suscriptores    | Formularios con doble opt-in, campañas RSS, en español |
| Buttondown     | ~100 suscriptores      | Simple, pensado para newsletters, RSS a email          |
| Brevo          | ~300 emails/día        | Transaccionales + marketing                            |
| Resend         | ~3.000 emails/mes      | Para enviar desde la API propia (más trabajo)          |

Formulario de suscripción en el blog, las recetas y el pie; doble opt-in y baja en un clic
(RGPD). Más adelante, la suscripción puede vincularse a la cuenta de Milimon.
