# PracHub — Servidor (Backend API)

API REST de PracHub construida con **Express + Sequelize + MySQL**. Expone la API
bajo `/api`, el chequeo `GET /health`, y se despliega en **Railway**.

> Este repositorio contiene **solo el backend**. El frontend (React/Vite) vive en
> un repositorio independiente (`PracHub-client`). Ver la guía general de
> arquitectura y despliegue combinado en el repositorio principal (`PracHub`) o en
> su propio `DEPLOYMENT.md`.

---

## Stack

- **Express 4** + **Sequelize 6** + **MySQL** (mysql2)
- **JWT** para autenticación + RBAC genérico (`authorize('admin'|'company'|'student')`)
- **Helmet**, **CORS** y **express-rate-limit** (rate limiting solo activo en producción)
- **Google Gemini** (3 modelos: FLASH, FLASH_2_5, FLASH_LITE) para IA
- Motor **TF-IDF** con `natural` para recomendaciones (sin Gemini)
- **Nodemailer** (SMTP; Ethereal automático en desarrollo)
- **Puppeteer** para exportar CV a PDF
- **Winston** para logging
- **Multer** para subida de logos (almacenamiento local o Cloudinary)

## Requisitos

- Node.js **20.19.0** o superior
- MySQL accesible (local o Railway)

## Puesta en marcha (desarrollo)

```bash
npm install
cp .env.example .env      # PowerShell: Copy-Item .env.example .env
npm run dev               # nodemon — http://localhost:4000
```

> Nunca subas `.env` al repositorio (ya está en `.gitignore`).

## Variables de entorno

Plantilla completa en [`.env.example`](.env.example). Variables críticas:

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor. Railway lo inyecta automáticamente; local usa `4000`. |
| `NODE_ENV` | `development` \| `production` \| `test` |
| `CLIENT_URL` | Origen(es) permitido(s) por CORS. Una URL o lista separada por comas (ej: `http://localhost:5173,https://app.vercel.app`). Los slashes finales se normalizan automáticamente. |
| `FRONTEND_URL` / `APP_URL` | URL del frontend usada en enlaces de emails/notificaciones. |
| `API_URL` | URL pública del backend (sin `/api`). Usada para construir URLs de logos. |
| `JWT_SECRET` | Secreto JWT (mín. 32 caracteres). |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | Conexión MySQL. |
| `GEMINI_API_KEY` | Clave de Google Gemini (IA). |
| `SMTP_*` | Configuración SMTP (obligatoria en producción). |
| `UPLOAD_PROVIDER` | `local` (por defecto) o `cloudinary`. |
| `ADMIN_ACCESS_SECRET` | Clave del portal admin (debe coincidir con `VITE_ADMIN_PORTAL_KEY`). |
| `ENABLE_SWAGGER` | `true`/`false`. En producción Swagger queda deshabilitado salvo `true`. |

### Subida de archivos (logos)

- `UPLOAD_PROVIDER=local` (por defecto): los logos se guardan en
  `public/uploads/logos` y se sirven en `/uploads`. **En Railway el filesystem es
  efímero: los archivos se pierden al re-desplegar.** Válido para demos; para
  persistencia real usa Cloudinary, un volumen o un bucket.
- `UPLOAD_PROVIDER=cloudinary`: requiere `CLOUDINARY_CLOUD_NAME`,
  `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET`.

## Scripts

| Comando | Acción |
|---|---|
| `npm start` | Producción (`node src/server.js`) |
| `npm run dev` | Desarrollo con nodemon |
| `npm test` | Jest + supertest |
| `npm run test:watch` | Jest en modo watch |
| `npm run test:coverage` | Jest con cobertura |
| `npm run lint` | ESLint |
| `npm run sync-db` | `sequelize.sync({ alter: true })` — **no usar en producción** sin revisar impacto |
| `npm run seed` | Carga data masiva de prueba (admin, 8 estudiantes, 5 empresas, 15 ofertas, postulaciones, mensajes, simulaciones, notificaciones). Idempotente. |
| `npm run seed:extra` | Carga data adicional (12 estudiantes, 5 empresas, 15 ofertas, ResumeVersions, InvitationToApply, CVAnalysis). Requiere `npm run seed` primero. |
| `npm run seed:clean` | Elimina toda la data de prueba (trunca tablas). |
| `node scripts/createAdmin.js` | Crea el administrador inicial |
| `node scripts/seedOffers.js` | Carga ofertas de demo (opcional, una sola vez) |

## Arquitectura

```
src/
├── config/         # geminiClient.js (GEMINI_MODELS), database.js (Sequelize)
├── controllers/    # Lógica de negocio por dominio
├── middlewares/    # authMiddleware, authorize, rateLimit, validateRequest, upload
├── models/         # Modelos Sequelize
├── routes/         # Definición de rutas Express
├── services/       # Servicios de IA y lógica de dominio
├── utils/          # logger.js (Winston)
└── docs/           # swagger.js
```

Convenciones:

- `authMiddleware` → `authorize(role)` → validaciones → controller.
- Modelos de Gemini vía `GEMINI_MODELS` (importar de `config/geminiClient.js`).
- Rate limiting desactivado fuera de producción.

## Tests

```bash
npm test        # Jest + supertest (NODE_ENV=test se aplica automáticamente)
npm run lint
```

Tests de IA (integración con la API real de Gemini) — *gated*:

```bash
# bash:
RUN_AI_INTEGRATION=true npm test -- --testPathPatterns=aiIntegration
# PowerShell:
$env:RUN_AI_INTEGRATION='true'; npm test -- --testPathPatterns=aiIntegration
```

Se omiten automáticamente sin `GEMINI_API_KEY` o sin `RUN_AI_INTEGRATION=true`
para no gastar cuota en CI.

CI: [`.github/workflows/ci.yml`](.github/workflows/ci.yml) ejecuta lint → tests en
cada PR/push a `main`/`develop`.

## Despliegue

Ver [`DEPLOYMENT.md`](DEPLOYMENT.md) para el despliegue paso a paso en **Railway**
(MySQL + backend, variables, Chromium para Puppeteer, admin inicial, etc.).
Resumen rápido:

1. Crear un proyecto en Railway con un servicio **MySQL** y un servicio desde
   este repositorio (raíz = este repo, sin subdirectorio).
2. Mapear las variables MySQL a `DB_*` y completar el resto (sección variables).
3. `nixpacks.toml` instala las dependencias de Chromium para Puppeteer.
4. Generar dominio, verificar `GET /health`, crear el admin inicial con
   `node scripts/createAdmin.js`.
