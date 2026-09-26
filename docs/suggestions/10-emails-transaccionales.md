# 10 · Emails transaccionales

Emails que manda el sistema por una acción de la persona (distintos del newsletter de
[02](./02-cms-y-emails.md)):

| Email                                          | Cuándo                            | Contenido                                                                                            |
| ---------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Bienvenida**                                 | Al crear la cuenta (primer login) | Saludo de Milagros, qué se guarda en la cuenta, enlaces a la calculadora, el blog y las preferencias |
| **Cuenta eliminada**                           | Al borrar la cuenta               | Confirmación de que los datos se borraron (RGPD), cómo volver si quiere                              |
| Confirmación de suscripción                    | Al suscribirse al newsletter      | Doble opt-in (lo resuelve el servicio de newsletter)                                                 |
| Inicio de sesión nuevo (opcional)              | Login desde un dispositivo nuevo  | Aviso de seguridad con fecha y navegador                                                             |
| Resumen mensual (opcional, con consentimiento) | Una vez por mes                   | Cálculos guardados, recetas nuevas                                                                   |

## Avisos de receta y artículo nuevos

Cuando se publica una receta o un artículo, quienes estén suscriptos reciben un email con la foto,
el título, una bajada, los milicitos (si es una reseña) y el botón para leerlo.

- **Plantillas** "Nueva receta" y "Nuevo artículo" hechas con los mismos componentes de email
  (ver abajo), en es/en según el idioma de la suscripción.
- **Para empezar, sin backend:** el sitio publica el RSS y MailerLite (o Brevo) envía una campaña
  automática por cada entrada nueva usando nuestra plantilla (exportada como HTML).
- **Más adelante, desde la API:** al publicar en el CMS, un webhook avisa a `api-milimon`, que
  envía a la lista de suscriptores (guardada con doble opt-in y baja en un clic) por el proveedor.
- Frecuencia: como máximo un aviso por día; si hay varias publicaciones, un resumen.

## ¿Sirve la librería de componentes actual?

**No directamente.** Los clientes de correo (Gmail, Outlook, Apple Mail) no entienden clases de
Tailwind, variables CSS, flexbox moderno ni JavaScript: necesitan HTML con tablas y estilos en
línea. Los componentes de `@inzumer/ui-library` dependen justamente de eso.

Lo que **sí** se reutiliza es el sistema de diseño: los valores de `@inzumer/tokens` (colores,
tipografías, espacios) exportados en TypeScript.

## Propuesta

- **Nuevo paquete `@inzumer/email`** dentro del monorepo de `ui-library`, hecho con
  **React Email** (gratis, open source): componentes para email (`EmailLayout`, `Heading`, `Text`,
  `Button`, `Card`, `Footer` con la baja) que leen los valores de `@inzumer/tokens` y se convierten
  en HTML compatible con los clientes de correo. Así comparte versión, changesets, Storybook
  (vista previa de cada email) y diseño con el resto de la librería, y sirve para todos los sitios.
- **Plantillas de Milimon** (bienvenida, cuenta eliminada, nueva receta, nuevo artículo…) en un **repositorio propio,
  `emails-milimon`**, o dentro de `api-milimon` si prefieren menos repos: cada plantilla es un
  componente con sus textos en es/en y se prueba con capturas.
- **Envío desde la API** (`api-milimon`), que ya sabe cuándo alguien se registra o borra la
  cuenta: un módulo `mail` con una cola simple y reintentos, que renderiza la plantilla y la envía
  por el proveedor.

## Proveedor (gratis)

| Servicio   | Plan gratuito (aprox.)      | Notas                                |
| ---------- | --------------------------- | ------------------------------------ |
| **Resend** | ~3.000 emails/mes, ~100/día | Pensado para React Email, API simple |
| Brevo      | ~300 emails/día             | También sirve para el newsletter     |
| Amazon SES | Muy barato, no gratis       | Para cuando el volumen crezca        |

Requisitos: dominio propio con **SPF, DKIM y DMARC** configurados (si no, los emails caen en
spam), remitente tipo `hola@milimon.com`, y en la política de privacidad el proveedor de email
como encargado del tratamiento.

## Orden sugerido

1. Dominio propio (ver [01](./01-deploy-y-seguridad.md)) y DNS del proveedor de email.
2. `@inzumer/email` con el layout y los componentes básicos.
3. Email de bienvenida y de cuenta eliminada desde la API.
4. El resto cuando haya necesidad.
