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

- Admin genera link desde **Perfiles (bloquear)** → botón **Cobrar**.
- El usuario paga en Mercado Pago.
- Mercado Pago notifica al webhook.
- El backend marca el pago como aprobado y extiende `subscription_expires_at`.
- Un scheduler cierra perfiles expirados (excepto admin).

Variables en `.env` (servicio `backend`):

- `MP_ACCESS_TOKEN=...` (token privado)
- Opcional retornos:
  - `MP_SUCCESS_URL=https://www.tu-dominio.com/app/`
  - `MP_FAILURE_URL=https://www.tu-dominio.com/app/`
  - `MP_PENDING_URL=https://www.tu-dominio.com/app/`

Webhook (configurarlo en panel Mercado Pago):

- URL: `https://www.tu-dominio.com/api/suscripciones/webhook/mercadopago`
- Evento recomendado: **payments**

Después:

```bash
docker compose up -d --build backend
```

### 3) Archivos estáticos “web-assets” (Editor web)

El módulo **Editor web (archivos)** permite subir archivos estáticos y servirlos públicamente en:

- `https://www.tu-dominio.com/web-assets/<archivo>`

En Docker (VPS) monta un volumen para persistirlos. Recomendado agregar en `docker-compose.yml` del VPS:

- En `backend.volumes`:\n  `- web_assets:/app/web-assets`
- En `volumes:`:\n  `web_assets:`

Y reconstruir:

```bash
docker compose up -d --build backend frontend
```

