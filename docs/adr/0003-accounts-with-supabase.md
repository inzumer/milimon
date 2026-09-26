# ADR 0003 · Cuentas con Supabase, offline-first

- **Estado:** reemplazada por [ADR 0004](0004-accounts-api.md) (API propia en otro repositorio)
- **Fecha:** 2026-09-26

## Contexto

La fase F10 agrega cuentas (Google y Facebook) para que cada persona guarde su configuración y sus
cálculos en un perfil y los use en cualquier dispositivo y país. El sitio es estático (Astro) y la
app tiene que seguir funcionando sin cuenta.

## Decisión

- **Supabase**: Auth con Google y Facebook + Postgres con Row Level Security. El SDK funciona desde
  el navegador, así que no hace falta SSR ni un backend propio. Flujo **PKCE** (el proveedor
  devuelve un código de un solo uso, nunca tokens en la URL).
- **Offline-first**: la UI sigue leyendo los repositorios locales (`localStorage`, síncronos). Un
  servicio de sincronización (`services/account/account-sync.ts`) copia el perfil remoto al
  iniciar sesión (una vez por sesión del navegador) y sube cada cambio local con debounce.
- **El perfil remoto gana** al iniciar sesión. En el primer inicio, si el dispositivo tiene datos
  que valga la pena conservar (borradores o una moneda distinta de la predeterminada), la persona
  elige entre importarlos o empezar de cero.
- **Al cerrar sesión o borrar la cuenta**, el dispositivo vuelve a modo invitado sin los datos de la
  persona (tema, idioma y consentimiento de analítica quedan: son del dispositivo).
- **`AccountBackend`** es la interfaz entre la app y el proveedor; `supabase-backend.ts` la
  implementa y los tests usan un fake en memoria. Cambiar a Firebase sería otra implementación.
- **Carga diferida**: el SDK (~216 KB sin comprimir) se importa de forma dinámica solo en la página
  de cuenta o cuando ya hay una sesión guardada (`milimon:auth` en `localStorage`). Los invitados
  no lo descargan.
- **Sin configuración, no hay cuentas**: si faltan `PUBLIC_SUPABASE_URL` o
  `PUBLIC_SUPABASE_PUBLISHABLE_KEY`, se ocultan el login del menú y de la home, y la página de cuenta
  lo explica.
- El **historial de cálculos** (hasta 15, con datos, resultado y desarrollo) sigue el mismo camino:
  `localStorage` + sincronización; el límite también lo aplica un trigger en la base.
- El borrado de cuenta usa una función SQL `security definer` (`delete_own_account`) que solo puede
  borrar al usuario de la sesión; perfil y borradores se borran en cascada.

## Consecuencias

- La clave publicable queda en el bundle a propósito: la seguridad está en RLS (cada fila solo es
  visible y editable por su dueño).
- Si alguien edita en dos dispositivos a la vez, gana la última escritura por ítem (perfil o
  borrador de una fórmula). Es suficiente para preferencias y borradores.
- Un cambio hecho sin conexión queda en el dispositivo; si falla la subida se avisa en consola y se
  vuelve a sincronizar con el próximo cambio o inicio de sesión.
