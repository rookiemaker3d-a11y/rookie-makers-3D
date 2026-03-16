# Notificaciones por correo (Gmail)

Para que al vendedor le llegue un correo cuando marques su cotización como lista, y un recordatorio cada 30 min hasta que entre a la app:

## 1. Gmail: contraseña de aplicación

1. Entra a [Google – Cuenta](https://myaccount.google.com/) → **Seguridad**.
2. Activa **Verificación en 2 pasos** si no la tienes.
3. En **Verificación en 2 pasos**, baja a **Contraseñas de aplicaciones**.
4. Genera una contraseña para “Correo” (o “Otro”). Copia la contraseña de 16 caracteres.

## 2. Variables de entorno en el backend

En el servidor donde corre el backend (Render, tu PC, etc.) define en `.env` o en el panel de variables:

```env
# Gmail (notificaciones al vendedor)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_correo@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
APP_BASE_URL=https://tu-app.onrender.com
```

- **SMTP_USER**: el Gmail desde el que se envían los correos (ej. `rookiemaker3d@gmail.com`).
- **SMTP_PASSWORD**: la contraseña de aplicación de 16 caracteres (sin espacios o con espacios, ambos suelen funcionar).
- **APP_BASE_URL**: URL del frontend para el enlace “Entrar a la app” en el correo (ej. `https://rookie-makers-3d.onrender.com`).

Si no pones `SMTP_USER` y `SMTP_PASSWORD`, la app sigue funcionando pero no se envía ningún correo.

## 3. Comportamiento

- Cuando **tú** (diseñador) marcas una cotización como **“Marcar como cotizado”**, se envía **un correo al vendedor** (al correo del usuario que creó la orden).
- Cada **30 minutos** se envía un **recordatorio** al mismo correo hasta que el vendedor **entre a la app** (página Cotizaciones espera). Al entrar se marcan como vistas y se dejan de enviar recordatorios.
- Máximo **24 recordatorios** (12 horas) por cotización.
