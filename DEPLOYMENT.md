# Despliegue del servidor en Railway

Guía para publicar el **backend** de PracHub (Express + Sequelize + MySQL) en
**Railway**, junto con su base de datos MySQL. Este repositorio se despliega por
separado del frontend (ver `PracHub-client`).

> **Sobre el costo:** Railway ofrece un crédito inicial de prueba (USD 5 / ~30
> días); después aplica el plan Free con crédito mensual limitado y los volúmenes
> persistentes de cuentas de prueba pueden eliminarse al terminar el trial. Esta
> arquitectura sirve para una demo académica o pruebas, no como almacenamiento
> gratuito permanente. Revisa la
> [documentación del trial](https://docs.railway.com/pricing/free-trial) antes de
> crear la base de datos.

## 1. Arquitectura

```text
Vercel: frontend (PracHub-client)
   │  VITE_API_URL=https://<backend>.up.railway.app/api
   v
Railway: este repo (Node + Express)   ──>  Railway MySQL
   ├── Google Gemini API (IA)
   ├── SMTP (correos transaccionales)
   └── Chromium (Puppeteer) para PDF de CV
```

El backend escucha el puerto que Railway inyecta en `PORT`, expone
`GET /health` y publica la API bajo `/api`.

## 2. Requisitos previos

1. Este repositorio disponible en GitHub.
2. Cuenta de [Railway](https://railway.com/).
3. URL pública del frontend desplegado en Vercel (para `CLIENT_URL`).
4. Una clave de Google Gemini (para análisis de CV y simulación de entrevistas).
5. Un proveedor SMTP para producción (institucional, plan gratuito o cuenta de
   prueba para la demo).
6. Node.js **20.19.0** o superior para validar localmente.

Validar antes de publicar:

```bash
npm ci
npm run lint
npm test
```

```powershell
Copy-Item .env.example .env   # luego completa los valores locales
```

Nunca subas `.env` al repositorio.

## 3. Variables de entorno

Configurar estas variables en el servicio Node de Railway. Los valores de ejemplo
solo explican el formato; reemplázalos por valores reales.

| Variable                  | Valor para producción                |             Requerida | Notas                                                                                 |
| ------------------------- | ------------------------------------- | --------------------: | ------------------------------------------------------------------------------------- |
| `NODE_ENV`              | `production`                        |                   Sí | Activa HSTS y los límites de rate limiting.                                          |
| `PORT`                  | No fijar manualmente                  |                   Sí | Railway la inyecta automáticamente. El código usa`4000` solo como fallback local. |
| `CLIENT_URL`            | `https://<frontend>.vercel.app`     |                   Sí | Origen permitido por CORS. Sin`/` final.                                            |
| `FRONTEND_URL`          | `https://<frontend>.vercel.app`     |                   Sí | URL usada en enlaces de notificaciones.                                               |
| `APP_URL`               | `https://<frontend>.vercel.app`     |                   Sí | URL base de enlaces enviados por email.                                               |
| `API_URL`               | `https://<backend>.up.railway.app`  |                   Sí | URL pública del backend, sin`/api`. Usada para construir URLs de logos locales.    |
| `ENABLE_SWAGGER`        | `false`                             |                    No | Swagger deshabilitado en producción salvo`true` explícito.                        |
| `UPLOAD_PROVIDER`       | `local`                             |                    No | `local` (por defecto) o `cloudinary`. Ver sección 7.                             |
| `CLOUDINARY_*`          | —                                    | Solo si`cloudinary` | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.         |
| `JWT_SECRET`            | Cadena aleatoria de 32+ caracteres    |                   Sí | No reutilizar el valor de desarrollo.                                                 |
| `DB_HOST`               | Host interno de MySQL                 |                   Sí | Usar la referencia interna de Railway, no`localhost`.                               |
| `DB_PORT`               | Puerto interno de MySQL               |                   Sí | Valor entregado por el servicio MySQL.                                                |
| `DB_NAME`               | Nombre entregado por MySQL            |                   Sí | Debe coincidir con la base creada.                                                    |
| `DB_USER`               | Usuario entregado por MySQL           |                   Sí | No tiene que ser`root`.                                                             |
| `DB_PASSWORD`           | Contraseña entregada por MySQL       |                   Sí | El nombre correcto en el código es`DB_PASSWORD`, no `DB_PASS`.                   |
| `GEMINI_API_KEY`        | Clave de Google Gemini                |               Para IA | Solo en Railway; nunca como variable`VITE_`.                                        |
| `SMTP_HOST`             | Host SMTP                             |           Para emails | En producción el correo debe estar configurado.                                      |
| `SMTP_PORT`             | `587` o `465`                     |           Para emails | Depende del proveedor.                                                                |
| `SMTP_SECURE`           | `false` para 587, `true` para 465 |           Para emails | Texto`true` o `false`.                                                            |
| `SMTP_USER`             | Usuario SMTP                          |           Para emails |                                                                                       |
| `SMTP_PASS`             | Contraseña SMTP                      |           Para emails | Usar un*app password* si el proveedor lo requiere.                                  |
| `SMTP_FROM`             | Remitente verificado                  |           Para emails | Ej.:`PracHub <noreply@dominio.com>`.                                                |
| `ADMIN_ACCESS_SECRET`   | Cadena aleatoria                      |        Sí para admin | Debe coincidir con`VITE_ADMIN_PORTAL_KEY` del cliente.                              |
| `ADMIN_ALERT_EMAIL`     | Email del administrador               |           Recomendado | Destinatario de alertas administrativas.                                              |
| `ADMIN_SEED_EMAIL`      | Email inicial                         |              Opcional | Usado por`scripts/createAdmin.js`.                                                  |
| `ADMIN_SEED_PASSWORD`   | Contraseña inicial                   |              Opcional | No dejar contraseña de ejemplo en producción.                                       |
| `LOG_LEVEL`             | `info`                              |           Recomendado | `warn` o `error` para menos ruido.                                                |
| `SEED_COMPANY_PASSWORD` | Contraseña temporal                  |             Solo seed | La usa`scripts/seedOffers.js`.                                                      |

Generar secretos sin inventarlos:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Plantilla: [`.env.example`](.env.example).

## 4. Crear la base de datos MySQL en Railway

1. Crear un proyecto nuevo en Railway.
2. Agregar un servicio **MySQL** desde el catálogo/template disponible.
3. Esperar a que termine de inicializar.
4. En las variables del servicio MySQL, identificar los valores equivalentes a:
   - `MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER`, `MYSQLPASSWORD`
5. En el servicio del backend, copiarlos a `DB_HOST`, `DB_PORT`, `DB_NAME`,
   `DB_USER` y `DB_PASSWORD`. Railway permite referenciar variables de otro
   servicio; verifica que el nombre del servicio generado coincida.
6. No conectar el backend a `127.0.0.1`/`localhost`: dentro de Railway el host
   debe ser el host interno del servicio MySQL.

### Persistencia

La base necesita un volumen persistente. En una cuenta de prueba, revisa las
reglas de retención antes de guardar datos importantes. Para una demo, exporta
MySQL periódicamente; para producción real, usa un plan con persistencia y
backups.

## 5. Desplegar el backend en Railway

Este repositorio **ya es solo el servidor**, por lo que **no se debe** configurar
un *Root Directory* en `server/` (la raíz del repo ya es la app).

1. En el proyecto de Railway, agregar un servicio desde este repositorio GitHub.
2. **Root Directory:** dejar la raíz (vacío / `.`). No apuntar a `server/`.
3. Comandos (Railway los autodetecta desde `package.json`; si los pides
   explícitos):
   - **Build Command:** `npm ci`
   - **Start Command:** `npm start`
4. Agregar las variables de la sección 3.
5. Generar un dominio público desde **Networking → Generate Domain**.
6. Copiar ese dominio (p. ej. `https://prachub-api-production.up.railway.app`) y
   usarlo como `API_URL`.
7. Verificar los logs hasta ver `PracHub API listening on port …`.
8. Probar el health check:

```bash
curl https://<backend>.up.railway.app/health
# {"status":"ok","service":"prachub-api"}
```

Railway inyecta `PORT`; no uses un puerto fijo. El backend ya usa
`process.env.PORT`.

### Inicialización del esquema

Al arrancar, `src/server.js` ejecuta `sequelize.sync({ alter: false })`, que crea
las tablas que no existan. **No** ejecuta automáticamente `src/migrations/` ni
modifica tablas existentes. Para cambios de esquema posteriores, prepara una
migración controlada con backup previo.

No ejecutes `npm run sync-db` en producción: usa `alter: true` y puede modificar
el esquema de forma no deseada.

### Crear el administrador inicial

Con el backend y la base disponibles, abre la **shell** del servicio Railway y
ejecuta desde la raíz del repo:

```bash
node scripts/createAdmin.js
# o con credenciales explícitas:
node scripts/createAdmin.js admin@dominio.com "UnaContraseñaLargaYUnica"
```

### Cargar ofertas de demo (opcional)

Solo para una demo, configura temporalmente `SEED_COMPANY_PASSWORD` y ejecuta una
sola vez:

```bash
node scripts/seedOffers.js
```

Crea cinco ofertas aprobadas si no existe ninguna empresa. Ejecútalo una sola vez
para evitar duplicados.

## 6. Chromium para Puppeteer (PDF de CV)

La exportación de CV a PDF usa Puppeteer con Chromium (`--no-sandbox`). En Railway
el contenedor necesita librerías de sistema para ejecutar Chromium.

- **Si tu servicio usa el builder Nixpacks** (clásico): este repo incluye
  [`nixpacks.toml`](nixpacks.toml), que instala las dependencias necesarias
  automáticamente. No se requiere acción.
- **Si tu servicio usa el builder Railpack** (más nuevo, puede ser el actual):
  `nixpacks.toml` se ignora. Configura estas variables de servicio en Railway:
  - `RAILPACK_BUILD_APT_PACKAGES` = `libnss3,libatk1.0-0,libatk-bridge2.0-0,libcups2,libdrm2,libxkbcommon0,libxcomposite1,libxdamage1,libxfixes3,libxrandr2,libgbm1,libasound2,libpango-1.0-0,libcairo2,fonts-liberation`
  - `RAILPACK_DEPLOY_APT_PACKAGES` = (la misma lista, para runtime)
  - Si `libasound2` no se encuentra (Ubuntu 24.04 lo renombró a
    `libasound2t64`), ajústalo en ambas variables.
- También puedes **forzar el builder Nixpacks** desde Railway → Settings →
  Builder para usar `nixpacks.toml`.

Referencia: [Railway — Build configuration](https://docs.railway.com/builds/build-configuration).

## 7. Archivos subidos (logos) — sin nube por ahora

Por defecto `UPLOAD_PROVIDER=local`: los logos se guardan en
`public/uploads/logos` y se sirven en `/uploads` con cabeceras CORS. El endpoint
`POST /api/upload/logo` admite imágenes de hasta 2 MB (JPEG, PNG, WebP, GIF) y
guarda la URL resultante en `Company.logoUrl`.

> **Aviso importante:** en Railway el filesystem **es efímero**. Los logos
> subidos **se pierden al re-desplegar** el servicio. Esto es aceptable para una
> demo académica. Para persistencia real, integra Cloudinary
> (`UPLOAD_PROVIDER=cloudinary` + `CLOUDINARY_*`), un volumen persistente de
> Railway o un bucket (S3/GCS). El código ya soporta Cloudinary sin cambios.

## 8. Verificación posterior al despliegue

### Backend

- [ ] `GET https://<backend>.up.railway.app/health` devuelve `200`.
- [ ] Los logs no muestran errores de autenticación de MySQL.
- [ ] `NODE_ENV=production` está configurado.
- [ ] `CLIENT_URL` coincide exactamente con el dominio de Vercel.
- [ ] `API_URL` no termina en `/api` y no contiene `localhost`.
- [ ] `GEMINI_API_KEY` configurada si se prueban funciones de IA.
- [ ] SMTP configurado antes de probar verificación de email / recuperación /
  notificaciones.
- [ ] `/api-docs` devuelve 404 en producción (salvo `ENABLE_SWAGGER=true`).
- [ ] La exportación de CV a PDF funciona (Chromium con las libs de la sección 6).

### Integración

- [ ] Crear una cuenta de estudiante desde el frontend.
- [ ] Crear/habilitar una cuenta de empresa.
- [ ] Crear una oferta y revisar su moderación desde el admin.
- [ ] Probar una postulación y el cambio de estado.
- [ ] Probar un mensaje entre empresa y candidato.
- [ ] Probar una función de Gemini.
- [ ] Revisar que los emails contengan enlaces al dominio de Vercel (no
  `localhost`).

## 9. Solución de problemas

### Error de CORS

`CLIENT_URL` debe ser el dominio exacto de Vercel, sin `/` final. Reiniciar el
servicio. No usar `*` (el backend usa `credentials: true`).

### Error de conexión a MySQL

1. `DB_HOST` no es `localhost`.
2. `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD` provienen del servicio MySQL
   correcto.
3. Backend y MySQL en el mismo proyecto o con conectividad permitida.
4. No se usó `DB_PASS` (el código lee `DB_PASSWORD`).

### La exportación de CV/PDF falla (Puppeteer/Chromium)

Faltan librerías de Chromium. Aplica la sección 6: verifica el builder (Nixpacks
usa `nixpacks.toml`; Railpack necesita `RAILPACK_*_APT_PACKAGES`) y redeploya.
Revisa los logs de Railway.

### Los enlaces de emails apuntan a localhost

Configurar `APP_URL` y `FRONTEND_URL`. `API_URL` solo apunta al backend y no
reemplaza la URL del frontend.

### El logo subido desaparece tras un redeploy

Comportamiento esperado con `UPLOAD_PROVIDER=local` (filesystem efímero de
Railway). Sube el logo de nuevo o integra Cloudinary/volumen (sección 7).

### Gemini no responde

Comprobar `GEMINI_API_KEY`, la cuota del proveedor y los logs de Railway (sin
imprimir la clave).

## 10. Seguridad y mantenimiento

- No registrar JWT, contraseñas, claves SMTP ni `GEMINI_API_KEY`.
- Rotar `JWT_SECRET`, `ADMIN_ACCESS_SECRET`, SMTP y Gemini si se exponen.
- No versionar `.env`.
- Mantener `NODE_ENV=production` para rate limiting y HSTS.
- Mantener `ENABLE_SWAGGER=false`; habilitarlo solo temporalmente para soporte.
- Hacer backups de MySQL antes de cambios de esquema.
- Vigilar el consumo de Railway para no superar el crédito gratuito.
- Revisar los límites y precios oficiales de Railway (los planes gratuitos
  cambian).

## 11. Referencias

- [Railway — Free Trial](https://docs.railway.com/pricing/free-trial)
- [Railway — Build configuration](https://docs.railway.com/builds/build-configuration)
- [Nixpacks — Configuration file](https://nixpacks.com/docs/configuration/file)
- [Vercel — Environment variables](https://vercel.com/docs/environment-variables)
