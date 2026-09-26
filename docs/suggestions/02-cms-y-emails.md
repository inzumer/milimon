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

## Sincronizar lo que hoy está fijo con lo que será dinámico

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
