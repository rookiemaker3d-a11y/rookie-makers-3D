# Cómo mantener el backend de Render despierto (evitar que "se caiga")

## ¿Qué pasa en Render?

En el **plan gratuito** de Render, el backend (Web Service) **se apaga solo** después de unos **15 minutos sin recibir ninguna petición**. Cuando alguien entra a la página, la primera petición puede tardar **30–60 segundos** en responder porque el servidor tiene que “despertar”. Eso es lo que sientes cuando “ya se cayó”.

**El “bot” que mantiene el servidor despierto NO está en tu código.** Es un servicio externo que hace una petición HTTP a tu backend cada cierto tiempo. Si no tienes nada configurado, el servidor se duerme tras 15 min de inactividad.

---

## Cómo “activar” el bot (monitor externo)

Tienes que usar un **servicio de monitoreo** que llame a tu API cada 10–15 minutos. Así Render considera que hay tráfico y no apaga el servicio (o lo despierta antes de que entren usuarios).

### Opción 1: UptimeRobot (recomendada, gratis)

1. Entra en **https://uptimerobot.com** y crea una cuenta gratis.
2. **Add New Monitor**:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** p. ej. `Rookie API Keep-Alive`
   - **URL:** la URL de tu backend en Render **más** `/api/health`, por ejemplo:
     - `https://rookie-makers-3d.onrender.com/api/health`
     - (Sustituye por la URL real de tu Web Service en Render si es distinta.)
   - **Monitoring Interval:** cada **5 minutos** (en plan gratis suele permitir 5 min; si solo ofrece 10 min, también vale).
3. Guarda el monitor.

Ese monitor hará una petición GET a `/api/health` cada X minutos. Tu backend ya tiene esa ruta y responde `{"status":"ok"}`. Con eso basta para que Render no apague el servicio por inactividad.

### Opción 2: cron-job.org

1. Entra en **https://cron-job.org** y crea una cuenta.
2. Crea un nuevo cron job que haga una petición GET a:
   - `https://rookie-makers-3d.onrender.com/api/health`
3. Programa la ejecución cada **10** o **15 minutos**.

---

## Resumen

| Pregunta | Respuesta |
|----------|-----------|
| ¿El bot está en el código del proyecto? | **No.** No hay ningún script ni bot dentro del repo que mantenga el servidor despierto. |
| ¿Qué tengo que hacer para “activarlo”? | Configurar un **monitor externo** (UptimeRobot, cron-job.org, etc.) que llame a tu URL de Render cada 10–15 min. |
| ¿Qué URL debe llamar el monitor? | `https://TU-BACKEND.onrender.com/api/health` (la misma que usas en `VITE_API_URL` + `/api/health`). |
| ¿Qué hace `/api/health`? | Ya está en el backend: responde `{"status":"ok"}`. No necesitas cambiar código. |

Si después de configurar el monitor el servidor sigue tardando en responder la primera vez tras mucho rato sin uso, puede ser que el intervalo sea mayor de 15 min o que Render en plan gratis siga apagando; en ese caso, acortar el intervalo (p. ej. 5 min) suele mejorar.
