# Registro de autoservicio: guía de configuración y salida a producción

Esta guía cubre la fase 2 (registro y verificación de correo). Sigue el orden de
abajo: si activas el captcha en Supabase antes de que la app envíe el token, el
ingreso de todos los usuarios deja de funcionar.

> Importante: el proyecto alojado en supabase.com **no lee `supabase/config.toml`**.
> Ese archivo solo configura el Supabase local (Docker). Todo lo de la sección
> "Supabase (panel web)" se hace a mano en el dashboard.

## 1. Qué hace el flujo

1. `/registro`: nombre, correo, contraseña, país y aceptar términos. Protegido con
   Cloudflare Turnstile (si hay clave), campo trampa (honeypot) y bloqueo de
   correos desechables.
2. Supabase crea el usuario sin confirmar y envía el correo de confirmación.
3. `/registro/verifica`: pantalla de espera con botón para reenviar.
4. El correo lleva a `/auth/confirm?token_hash=...`. El usuario pulsa
   "Confirmar mi correo" (es un botón y no un GET, para que los escáneres de
   correo no consuman el enlace de un solo uso).
5. Se verifica el token, se abre la sesión y se redirige a `/panel`. El trigger
   `handle_new_user` (migración 12) ya creó el perfil y la prueba Essential de 30 días.

## 2. Antes de nada: migración 13

Aplica la migración `20261117000013_public_page_paused_marker.sql`:

```bash
supabase db reset          # local
supabase test db           # local, debe pasar todo
supabase migration list --linked
supabase db push --linked  # producción
```

## 3. Cloudflare Turnstile

1. Cloudflare dashboard > Turnstile > Add widget.
2. Dominios: `www.emblematicocr.com` (y `emblematicocr.com` si aplica). Modo: Managed.
3. Guarda la **Site key** (pública) y la **Secret key** (privada, va a Supabase).
4. Para desarrollo local usa las claves de prueba de Cloudflare:
   - Site key que siempre pasa: `1x00000000000000000000AA`
   - Secret key que siempre pasa: `1x0000000000000000000000000000000AA`

## 4. Resend (correos)

1. Resend > Domains > agrega `emblematicocr.com`.
2. Crea en tu DNS los registros que Resend indica: SPF, DKIM y (recomendado) DMARC.
   Espera a que el dominio quede en "Verified".
3. Crea una API key con permiso de envío.
4. Remitente sugerido: `emblemático <no-reply@emblematicocr.com>`.

## 5. Supabase (panel web)

En el proyecto `hjkexfmnqmwtueehtzcc`:

- **Authentication > Sign In / Providers > Email**
  - Enable email signup: activado.
  - Confirm email: **activado**.
  - Minimum password length: 8. Password requirements: letras y números.
- **Authentication > Attack Protection**
  - Enable CAPTCHA protection: activado, proveedor Turnstile, pega la **Secret key**.
    (Hazlo solo después del paso 1 del orden de salida.)
- **Authentication > SMTP Settings** (o Project Settings > Auth > SMTP)
  - Host `smtp.resend.com`, puerto 465, usuario `resend`, contraseña = API key de Resend.
  - Remitente: `no-reply@emblematicocr.com`, nombre `emblemático`.
- **Authentication > Emails > Confirm sign up**
  - Asunto sugerido: `Confirma tu correo en emblemático`.
  - Pega el HTML de `supabase/templates/confirmation.html`.
- **Authentication > URL Configuration**
  - Site URL: `https://www.emblematicocr.com`
  - Redirect URLs: agrega `https://www.emblematicocr.com/auth/confirm`
    (y `http://localhost:3000/auth/confirm` para desarrollo).
- **Authentication > Rate Limits**: revisa el límite de correos por hora y de
  registros por IP; los valores por defecto son razonables.

## 6. Vercel

Agrega la variable de entorno (Production y Preview):

```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<site key de Cloudflare>
```

Es `NEXT_PUBLIC_`, así que se incrusta en el build: hay que **redesplegar** después
de crearla. Con la variable definida, la CSP del sitio también admite
`https://challenges.cloudflare.com`.

## 7. Orden de salida (importante)

1. Aplicar migración 13 en producción.
2. Crear la variable `NEXT_PUBLIC_TURNSTILE_SITE_KEY` en Vercel y **desplegar**.
   El código nuevo ya envía el token del captcha en registro e ingreso.
3. En Supabase, activar el captcha de Turnstile con la Secret key.
4. Configurar Resend (dominio, DNS, SMTP) y pegar la plantilla de confirmación.
5. Agregar `https://www.emblematicocr.com/auth/confirm` a las Redirect URLs.
6. Activar signups y "Confirm email" en Supabase (último paso, abre el registro al público).
7. Prueba completa con un correo real (ver sección 9).

Si algo falla con el captcha, el rollback es desactivarlo en Supabase: la app
sigue funcionando sin él.

## 8. Probar en local

```bash
supabase start
pnpm dev
```

- Variables en `.env.local`: `NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA`
  (o vacío para desactivar el captcha en local).
- Si activas el captcha en `supabase/config.toml` (bloque `[auth.captcha]`, hoy
  comentado), usa la secret de prueba de la sección 3.
- Los correos locales no salen a internet: ábrelos en Inbucket,
  <http://127.0.0.1:54324>.

## 9. Lista de verificación en producción

- [ ] `/registro` muestra el widget de Turnstile.
- [ ] Un registro con un correo nuevo llega a `/registro/verifica` y recibe el correo.
- [ ] El correo llega a la bandeja (no a spam) y el enlace abre `/auth/confirm`.
- [ ] Pulsar "Confirmar mi correo" lleva a `/panel` con sesión iniciada.
- [ ] El panel muestra Essential con prueba de 30 días (visible en la fase 3).
- [ ] Un correo desechable (por ejemplo `x@mailinator.com`) es rechazado.
- [ ] El ingreso con contraseña, el enlace mágico y el restablecimiento siguen funcionando.
- [ ] Registrar el mismo correo con otro alias de Gmail (`+algo` o con puntos) no da una segunda prueba.

## 10. Pendientes y salvedades

- `/terminos` y `/privacidad` son **borradores**: necesitan revisión legal antes
  de abrir el registro.
- La pieza de bienvenida 3D elegida en las tarjetas de planes y el periodo
  (mensual/anual) no se guardan al registrarse; el periodo solo viaja como
  parámetro en `/registro`.
- Fases 3 y 4 (panel y admin) ya están en `main`.

## 11. Job diario y correos (fase 5)

Una vez al día, a las 6:00 de Costa Rica (12:00 UTC), `pg_cron` en Supabase llama a
`POST /api/cron/subscriptions` con una clave secreta. Esa ruta:

1. Baja a Free las pruebas y los planes pagados que vencieron (los pagados tienen 7
   días de gracia), refresca sus guías públicas en caché y les envía un correo.
2. Envía los recordatorios: 7 y 3 días antes de que termine la prueba (días 23 y 27),
   7 días antes de que venza un plan pagado y el día que vence. Cada correo se envía
   una sola vez por periodo (tabla `subscription_notices`).

El plan efectivo ya se calcula al vuelo, así que si un día el job no corre nadie se
queda con un plan que no pagó; solo se atrasan los correos.

Cada cuenta que baja a Free queda anotada en la tabla `subscription_expirations`
(migración 15) en el mismo paso. La ruta la procesa por lotes de 100 y marca cada fila
como procesada, con un límite de unos 40 segundos y un correo cada 0,6 segundos (unos
60 correos por corrida). Lo que no alcance a procesar queda pendiente para la corrida
siguiente; nunca se pierde una cuenta.

### Configuración (una vez)

1. **Clave secreta.** Genera una en tu terminal: `openssl rand -hex 32`.
2. **Vercel** (Production): agrega `CRON_SECRET` con esa clave y `RESEND_API_KEY` con
   una API key de Resend (Resend > API Keys > permiso "Sending access", dominio
   `mail.emblematicocr.com`). Opcional: `EMAIL_FROM` (por defecto
   `emblemático <no-reply@mail.emblematicocr.com>`). **Redespliega.**
3. **Supabase > SQL Editor** (proyecto de producción), guarda la URL y la clave en Vault:

   ```sql
   select vault.create_secret('https://www.emblematicocr.com', 'cron_site_url');
   select vault.create_secret('<la misma clave de CRON_SECRET>', 'cron_secret');
   ```

4. **Migraciones 14 y 15** (`20261118000014_subscription_jobs.sql` activa `pg_cron` y
   `pg_net` y programa el job; `20261119000015_subscription_expiry_queue.sql` crea la
   cola de expiraciones).

   ```bash
   supabase db reset          # local
   supabase test db           # local, debe pasar todo
   supabase migration list --linked
   supabase db push --linked  # producción
   ```

   Si `db push` falla al crear las extensiones, actívalas en Supabase > Database >
   Extensions (`pg_cron` y `pg_net`) y vuelve a correrlo.

### Probarlo

- A mano, con la clave:

  ```bash
  curl -X POST -H "Authorization: Bearer <CRON_SECRET>" \
    https://www.emblematicocr.com/api/cron/subscriptions
  ```

  Responde un resumen, por ejemplo
  `{"expired":0,"processed":0,"pending":0,"guidesRefreshed":0,"emails":{"sent":0,"skipped":0,"failed":0},"emailConfigured":true}`.
  `expired` son las cuentas que bajaron a Free en esta corrida, `processed` las que
  recibieron su correo y refresco de guías, y `pending` las que quedan para mañana.
  Sin la clave correcta responde 401.
- Para ver un correo de prueba: con una cuenta tuya en prueba, cambia su
  `trial_ends_at` a dentro de 2 días (Supabase > Table Editor > `subscriptions`) y
  llama la ruta. Te llega "Te quedan 2 días de prueba".
- Historial del job en Supabase (SQL Editor):

  ```sql
  select status, return_message, start_time
  from cron.job_run_details order by start_time desc limit 5;

  select status_code, content, created
  from net._http_response order by created desc limit 5;
  ```

### Más adelante

- Si pasas a Vercel Pro puedes dejar el job en Supabase (no cambia nada) o moverlo a
  Vercel Cron: la ruta también acepta `GET` con `Authorization: Bearer <CRON_SECRET>`,
  que es lo que envía Vercel Cron.
