## SMTP (correos) y Suscripciones (Mercado Pago) en VPS

### 1) SMTP para enviar correos

El backend envía correos (alertas, recordatorios) vía **SMTP**. Recomendado: **Gmail SMTP** con **contraseña de aplicación**.

En el VPS, edita el archivo `.env` (en la raíz del repo) y agrega:

- `SMTP_USER=tu_correo@gmail.com`
- `SMTP_PASSWORD=xxxx xxxx xxxx xxxx` (contraseña de aplicación de 16 caracteres)
- `EMAIL_FROM=tu_correo@gmail.com` (opcional)
- `APP_BASE_URL=https://www.tu-dominio.com/app/` (URL pública del ERP)

Luego reconstruye backend:

```bash
cd /root/rookie-makers-3D
docker compose up -d --build backend
```

### 2) Mercado Pago (links de pago + webhook)

Se usa para **mensualidades por usuario** (planes por rol). Flujo:

- Configuras **planes por rol** (precio en MXN y días de periodo) vía API `PUT /api/suscripciones/planes` (o herramienta equivalente) con sesión de **admin**.
- En el ERP, **Perfiles (bloquear)** → **Cobrar**: el backend crea una **preferencia** en Mercado Pago y devuelve `payment_url`.
- El cliente paga en Mercado Pago.
- Mercado Pago llama al **webhook**; el backend consulta el pago en la API de MP, y si está `approved` extiende `subscription_expires_at` y deja al usuario activo.
- Un **scheduler** desactiva perfiles vencidos (no aplica a `admin`).

#### 2.1) Código en el servidor (Git + Docker)

Si `git pull` dice *Already up to date* pero el backend sigue cayendo con un error viejo, el commit nuevo **no está en GitHub** o estás en otra carpeta/repo. Tras un `push` desde tu PC, en el VPS:

```bash
cd /root/rookie-makers-3D
git fetch origin
git log -1 --oneline   # debe verse el último commit (ej. fix SQLAlchemy / suscripciones)
git pull origin main
docker compose build backend --no-cache
docker compose up -d backend
docker compose logs backend --tail 40
```

Comprueba que arranca (sin traceback al importar modelos) y que la API responde (ajusta host/puerto si probás directo al backend en `127.0.0.1:8002`):

```bash
curl -sS http://127.0.0.1:8002/api/health
```

En producción detrás del contenedor **frontend** (nginx), la misma ruta suele ser:

`https://TU_DOMINIO/api/health`

#### 2.2) Variables en `.env` (raíz del repo; `docker compose` las pasa al backend)

`docker-compose.yml` ya mapea estas variables al servicio `backend`. En el VPS, edita `.env` en la misma carpeta que `docker-compose.yml`:

| Variable | Obligatoria | Uso |
|----------|-------------|-----|
| `MP_ACCESS_TOKEN` | Sí, para cobrar | Token de la aplicación en [Mercado Pago Developers](https://www.mercadopago.com.mx/developers/panel/app). **Producción**: credencial de producción. **Pruebas**: token de prueba (el link de pago será sandbox). |
| `MP_SUCCESS_URL` | No | Tras pago aprobado, MP redirige al usuario aquí (ej. `https://www.tu-dominio.com/app/`). |
| `MP_FAILURE_URL` | No | Si el pago falla. |
| `MP_PENDING_URL` | No | Si queda pendiente (efectivo, etc.). |
| `MP_WEBHOOK_SECRET` | No | Reservado; la validación estricta de firma puede no estar activa en el código. |

Sin saltos de línea ni comillas en los valores salvo que el propio valor las necesite. Tras guardar `.env`:

```bash
docker compose up -d --build backend
```

#### 2.3) Webhook en el panel de Mercado Pago

1. Entra a **Tus integraciones** → tu aplicación → **Webhooks** (o Notificaciones IPN, según la versión del panel).
2. URL pública **HTTPS** que llegue al backend vía el mismo nginx que sirve `/api/`:

   `https://www.tu-dominio.com/api/suscripciones/webhook/mercadopago`

3. Tema / evento: notificaciones de **pagos** (`payment` / payments), para que el cuerpo incluya el `id` del pago que el backend consulta con `GET /v1/payments/{id}`.

**Importante:** si el dominio apunta solo al puerto 80/443 del VPS, tu reverse proxy (nginx del host o el contenedor `frontend`) debe **proxy_pass** `/api/` al servicio `backend:8000`, igual que en `frontend/deploy/nginx.conf`. Si MP no puede alcanzar esa URL (firewall, SSL incorrecto, ruta mal configurada), el cobro puede completarse en MP pero la suscripción **no** se extenderá hasta que el webhook responda 200 y el flujo encuentre el `pago_id` vía `external_reference` o `metadata`.

#### 2.4) Terminal: pegado raro `^[[200~`

Si al pegar comandos aparece `^[[200~` o `cd: command not found`, el cliente SSH está enviando “bracketed paste”. Pega de uno en uno o desactiva bracketed paste en tu terminal; el comando correcto es solo:

`cd /root/rookie-makers-3D`

### 3) Archivos estáticos “web-assets” (Editor web)

El módulo **Editor web (archivos)** permite subir archivos estáticos y servirlos públicamente en:

- `https://www.tu-dominio.com/web-assets/<archivo>`

En Docker (VPS) monta un volumen para persistirlos. En `docker-compose.yml` del repo ya debería figurar en `backend.volumes` la línea `web_assets:/app/web-assets` y en la sección `volumes:` la entrada `web_assets:`.

Y reconstruir:

```bash
docker compose up -d --build backend frontend
```

