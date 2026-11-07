# Recuperación y salida a producción

Pasos manuales antes de abrir `www.emblematicocr.com`. El código no puede comprar el plan ni apuntar el DNS.

## Copias de Supabase

Antes del lanzamiento, el proyecto de Supabase tiene que estar en el plan Pro. Pro guarda 7 días de backups diarios. Si no se acepta perder hasta un día de cambios, hay que activar Point-in-Time Recovery, que es un complemento de pago aparte (unos 100 dólares al mes por 7 días de retención). Con PITR activo, Supabase deja de hacer los backups diarios. El plan gratis no sirve para producción: no tiene backups.

Qué cubre cada cosa:

| Dato                                                                     | Lo cubre el backup de Supabase | Cómo se recupera                              |
| ------------------------------------------------------------------------ | ------------------------------ | --------------------------------------------- |
| Postgres: negocios, páginas, miembros, cotizaciones                      | Sí                             | Database → Backups                            |
| Cuentas de Auth (`auth.users`)                                           | Sí, viven en la misma base     | Vuelven con la restauración de la base        |
| Archivos del bucket `business-media`: logos, portadas, fotos de catálogo | **No**                         | Copia propia con `scripts/backup-storage.mjs` |

Los backups de la base guardan solo los metadatos de Storage, no los archivos. Restaurar un backup viejo tampoco devuelve archivos que se borraron después. Si alguien borra el bucket, o un negocio quita su logo y se limpia el archivo, la única copia es la que hagamos nosotros.

### Copia del bucket

Hay que hacerla a mano o con una tarea programada, por ejemplo cada semana y antes de cualquier operación grande. Guárdala fuera de Supabase y de este equipo (un disco externo o un almacenamiento aparte), porque son archivos de clientes.

1. Crea un archivo `.env.backup` (está ignorado por git) con las llaves del proyecto de producción:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<proyecto>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<llave service_role de producción>
   ```

2. Copia el bucket a una carpeta nueva con fecha:

   ```bash
   node --env-file=.env.backup scripts/backup-storage.mjs backup
   ```

   Sin argumento escribe en `backups/storage-AAAA-MM-DD/` (la carpeta `backups/` está ignorada por git). El script lista todo el bucket y descarga cada archivo con su misma ruta.

3. Verifica que el número de archivos copiados sea el esperado y mueve la carpeta al almacenamiento externo.

Las rutas importan: están guardadas en el contenido de las páginas (`logo_path`, `cover_path`) y en las imágenes del catálogo. Al restaurar hay que subir cada archivo con la misma ruta, y el script lo hace:

```bash
node --env-file=.env.backup scripts/backup-storage.mjs restore backups/storage-AAAA-MM-DD
```

La restauración no sobrescribe: omite los archivos que ya existen.

### Restaurar la base de datos

1. Supabase → Database → Backups (o Point in Time). Elige el punto y confirma. Eso reemplaza la base actual y el proyecto queda sin servicio mientras dura: avisa antes. Para no perder nada, restaura primero a un proyecto nuevo.
2. Si faltan archivos en Storage, restaura la última copia del bucket con el comando de arriba.
3. En Vercel no hace falta deploy. Publicar, suspender o cambiar un slug ya llama `revalidateTag`, y las páginas públicas se regeneran solas en cuestión de horas. Si necesitas que una página refleje la restauración al instante, cambia el estado de ese negocio desde `/admin` o vuelve a publicarlo.

### Copia local, solo para desarrollo

```bash
supabase db dump --local -f backup.sql
```

No subas ese archivo, `.env.backup` ni la llave `service_role` al repositorio.

## Vercel y el dominio

1. Importa el repo en Vercel. El framework es Next.js. No hace falta `vercel.json`.
2. Variables de Production:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (solo servidor: invitaciones)
   - `NEXT_PUBLIC_SITE_URL=https://www.emblematicocr.com`
   - `NEXT_PUBLIC_WHATSAPP_NUMBER=50688997060`
   - `QUOTE_IP_SALT` (secreto del rate limit de cotizaciones; uno distinto al de desarrollo)
3. En Supabase → Authentication → URL Configuration, el Site URL es `https://www.emblematicocr.com` y el redirect incluye `https://www.emblematicocr.com/auth/callback`.
4. En el registrador, `www.emblematicocr.com` apunta al dominio que indique Vercel. HTTPS lo termina Vercel. No pongas el apex a medias: el QR impreso usa `https://www.emblematicocr.com/negocio/{slug}`.
5. Con `NEXT_PUBLIC_SITE_URL` en https, la respuesta manda HSTS. Los headers de seguridad y la CSP salen de `next.config.ts`.

Comprobación después del primer deploy: una página publicada abre, un slug retirado redirige, un negocio suspendido responde 404, y el enlace de ingreso vuelve a este dominio.
