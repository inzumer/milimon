# Configurar las cuentas (Supabase + Google + Facebook)

Pasos para activar el inicio de sesión. Mientras falten las variables, el sitio funciona igual, pero
sin login.

## 1. Proyecto de Supabase

1. Crear un proyecto en <https://supabase.com> (región cercana a tu público, por ejemplo São Paulo).
2. **SQL Editor** → pegar y ejecutar, en orden, los archivos de `supabase/migrations/`
   (`…_accounts.sql` y `…_calculation_history.sql`), o usar la CLI: `supabase link` y después
   `supabase db push`.
3. **Project Settings → API**: copiar la **Project URL** y la **publishable key** (o la `anon` key en
   proyectos viejos).
4. En el hosting (Vercel), cargar:
   - `PUBLIC_SUPABASE_URL` = Project URL
   - `PUBLIC_SUPABASE_PUBLISHABLE_KEY` = publishable key
5. **Authentication → URL Configuration**:
   - Site URL: la URL pública (la misma que `SITE_URL`).
   - Redirect URLs: `https://TU-DOMINIO/es/account`, `https://TU-DOMINIO/en/account` y, para
     desarrollo, `http://localhost:4321/es/account` y `http://localhost:4321/en/account`.

La URL de callback que piden Google y Facebook es
`https://<ref-del-proyecto>.supabase.co/auth/v1/callback`.

## 2. Google

1. <https://console.cloud.google.com> → crear un proyecto → **APIs y servicios → Pantalla de
   consentimiento de OAuth** (tipo externo). Completar nombre, logo, dominio, y los links de
   privacidad (`/es/privacy`) y términos (`/es/terms`).
2. **Credenciales → Crear ID de cliente de OAuth** (aplicación web):
   - Orígenes autorizados: la URL pública.
   - URI de redireccionamiento: la URL de callback de Supabase.
3. Copiar Client ID y Client Secret en Supabase → **Authentication → Providers → Google**.

## 3. Facebook (Meta)

1. <https://developers.facebook.com> → **Crear app** → caso de uso "Autenticar y pedir datos a los
   usuarios con Facebook Login".
2. **Facebook Login → Configuración**: en "URI de redireccionamiento de OAuth válidos" pegar la URL
   de callback de Supabase.
3. **Configuración de la app → Básica**: URL de la política de privacidad (`/es/privacy`), términos
   (`/es/terms`) e **instrucciones de eliminación de datos**: `https://TU-DOMINIO/es/privacy#data-deletion`.
4. Pedir el permiso `email` (el perfil público viene por defecto) y pasar la app a modo **Activo**.
   Meta puede pedir verificación del negocio para ciertos permisos.
5. Copiar App ID y App Secret en Supabase → **Authentication → Providers → Facebook**.

## 4. Probar

1. `pnpm dev` con las variables en `.env`.
2. Ir a `/es/account` → "Continuar con Google" → volver a la página ya con la sesión iniciada.
3. Cambiar la moneda y cargar una calculadora; en Supabase → **Table Editor** tienen que aparecer
   la fila en `profiles` y los borradores en `calculator_drafts`. Guardar un cálculo en el
   historial agrega una fila en `calculation_history`.
4. Probar "Borrar mi cuenta": el usuario desaparece de **Authentication → Users** y sus filas también.
