# 04 · Medición y cuentas

## Google Tag Manager (pendiente)

1. Crear el contenedor web y cargar `PUBLIC_GTM_ID` en las variables del repo (activa el banner
   de cookies).
2. Dentro del contenedor: etiqueta de configuración de GA4 con Consent Mode v2 (el sitio ya envía
   `default: denied` y `update` según la respuesta).
3. Activadores de **evento personalizado** para los eventos que ya emite el sitio
   ([TRACKING.md](../TRACKING.md)) y de **clic** por id (`trackingId`).
4. Marcar como conversiones: `sign_in`, `calculation_saved`, `page_shared`, suscripción al
   newsletter (cuando exista).
5. Con la persona logueada y con consentimiento, enviar un `user_id` anónimo (hash del id de la
   cuenta) para medir el uso entre dispositivos.

**Qué mirar:** cuentas más usadas, en qué paso se abandona un cálculo, páginas que traen registros,
redes que traen visitas (UTM) y artículos más compartidos.

## Contenido para quienes se registran

Principio: **el contenido de estudio sigue público** (es lo que posiciona en Google y lo que se
comparte). Se reserva para cuentas lo que agrega valor personal:

- Guardar historial y borradores en la nube (ya existe).
- Exportar el costeo de una receta o el cuadro de resultados a PDF / Excel.
- Recetas guardadas, listas de compras generadas desde el costeo y escalado de porciones.
- Varias "cocinas" o locales por cuenta, con sus propios valores de coeficiente y moneda.
- Descargables (plantillas de costeo, fichas técnicas imprimibles).
- Acceso anticipado a recetas nuevas o comentarios en artículos.

Evitar un muro de registro para calcular: frena el uso y la difusión. Como alternativa suave: la
calculadora siempre libre y un aviso después de algunos cálculos invitando a crear la cuenta para
no perderlos.

## Otras ideas

- Onboarding breve al registrarse (elegir moneda, tipo de negocio).
- Notificaciones por email de recetas nuevas desde la cuenta (con consentimiento).
- Panel "Mi cocina" con los costos que más usa la persona.
