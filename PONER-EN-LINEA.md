# Qué necesitas para tener la app en línea (que cualquiera la vea)

## Lo que necesitas tener

1. **Cuenta en GitHub** (gratis) — [github.com](https://github.com)  
   Para subir tu código y conectarlo a Vercel y Render.

2. **Cuenta en Vercel** (gratis) — [vercel.com](https://vercel.com)  
   Aquí se hospeda la parte que se ve (la página web).

3. **Cuenta en Render** (gratis) — [render.com](https://render.com)  
   Aquí se hospeda la API (backend) y, si quieres, la base de datos.

4. **Tu proyecto en un repositorio de GitHub**  
   Si aún no está, en CMD (desde la carpeta del proyecto):
   ```cmd
   cd c:\Users\norbe\Desktop\rokie
   git init
   git add .
   git commit -m "Primer commit"
   ```
   Luego en GitHub creas un repo nuevo (sin README) y ejecutas:
   ```cmd
   git remote add origin https://github.com/TU_USUARIO/NOMBRE_REPO.git
   git branch -M main
   git push -u origin main
   ```
   (Sustituye TU_USUARIO y NOMBRE_REPO por los tuyos.)

---

## Orden de pasos (para que funcione)

### Paso 1 — Subir el código a GitHub

- Crea el repo en GitHub y sube el proyecto (los comandos de arriba).
- Sin esto, Vercel y Render no pueden desplegar.

---

### Paso 2 — Desplegar el BACKEND en Render

1. Entra en [render.com](https://render.com) → **New** → **Web Service**.
2. Conecta tu cuenta de GitHub y elige el repositorio del proyecto.
3. Configura el servicio:
   - **Name:** `rookie-api` (o el que quieras).
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. En **Environment** añade:
   - `DATABASE_URL` = `sqlite+aiosqlite:///./rookie_erp.db`
   - `CORS_ORIGINS` = déjalo vacío por ahora (lo pondrás en el paso 4).
5. Clic en **Create Web Service**.
6. Espera a que termine el deploy. Copia la **URL del servicio** (ej. `https://rookie-api.onrender.com`).  
   Esa es la URL de tu API; la usarás en el siguiente paso.

---

### Paso 3 — Desplegar el FRONTEND en Vercel

1. Entra en [vercel.com](https://vercel.com) → **Add New** → **Project**.
2. Importa el mismo repositorio de GitHub.
3. Configura:
   - **Root Directory:** `frontend` (edita y pon solo la carpeta frontend).
   - **Framework Preset:** Vite (lo detecta solo).
4. En **Environment Variables** añade:
   - **Name:** `VITE_API_URL`  
   - **Value:** la URL del backend **sin** `/api` al final (ej. `https://rookie-api.onrender.com`).
5. Clic en **Deploy**.
6. Cuando termine, tendrás una URL del frontend (ej. `https://rokie-xxx.vercel.app`). Copiala.

---

### Paso 4 — Decirle al backend desde qué página puede recibir peticiones (CORS)

1. Vuelve a **Render** → tu servicio **rookie-api** → **Environment**.
2. Edita `CORS_ORIGINS` y pon **exactamente** la URL de tu frontend en Vercel (ej. `https://rokie-xxx.vercel.app`).
3. Guarda. Render volverá a desplegar solo.

---

### Paso 5 — Crear el usuario admin en la base de datos (seed)

En Render, con SQLite, la base se borra cada vez que el servicio se reinicia. Para tener el usuario admin al menos una vez:

- En Render → tu Web Service (backend) → pestaña **Shell** (de pago en muchos planes).
- Ejecuta: `python -m app.seed`
- Así se crea el usuario **norbertomoro4@gmail.com** / **admin123** en el servidor.

Si no tienes Shell en Render, crea en Render una base **PostgreSQL** (Postgres) gratis, copia su `DATABASE_URL` y ponla en las variables de entorno del backend (sustituyendo la de SQLite). Luego en **Shell** (o en un “Background Worker” que ejecute una vez el seed) ejecuta `python -m app.seed`. Con PostgreSQL los datos ya no se pierden al reiniciar. Si no quieres pagar Shell, ejecuta el seed desde tu PC una sola vez con esa misma DATABASE_URL en el entorno.

---

## Resumen

| Qué          | Dónde   | URL que te dan                    |
|-------------|---------|------------------------------------|
| Frontend    | Vercel  | `https://tu-proyecto.vercel.app`   |
| Backend     | Render  | `https://rookie-api.onrender.com`  |

Esa URL de Vercel es la que compartes para que **cualquiera** entre. El backend (Render) debe tener en `CORS_ORIGINS` esa misma URL de Vercel.

---

## Si algo falla

- **"Algo salió mal" en la página:** Suele ser porque el frontend no puede hablar con el backend. Revisa que `VITE_API_URL` en Vercel sea la URL de Render (sin `/api`) y que en Render `CORS_ORIGINS` sea la URL de Vercel.
- **No puedo iniciar sesión:** Ejecuta el seed (Paso 5). Usuario: `norbertomoro4@gmail.com` / contraseña: `admin123`.
- **Render se duerme:** El plan gratis “apaga” el servicio tras inactividad. La primera vez que alguien entre puede tardar unos segundos en despertar.
