# Guía para tener Rookie Makers 3D en línea (sin abrir CMD a cada rato)

Esta guía explica **todo lo que necesitas** para que la app esté disponible sin tener que ejecutar `npm start` cada vez: ya sea **en internet** o **arrancando sola al encender el PC**.

---

## Resumen de opciones

| Opción | Qué consigues | Esfuerzo |
|--------|----------------|----------|
| **A. Desplegar en internet** | Entras desde cualquier sitio con una URL (ej. `https://rookie.vercel.app`) | Medio (gratis con límites) |
| **B. Arranque automático en Windows** | Al encender el PC, la app se inicia sola y usas `http://localhost:5173` | Bajo |

Puedes usar **solo A**, **solo B**, o **las dos**.

---

## Opción A — Tener la app en línea (internet)

Así no dependes del CMD ni de tener tu PC encendido. La app estará en una URL pública.

### 1. Frontend (Vite/React) en Vercel (gratis)

1. Crea cuenta en [vercel.com](https://vercel.com) (con GitHub).
2. Instala Vercel CLI (opcional): `npm i -g vercel`.
3. En la carpeta del proyecto:
   ```bash
   cd frontend
   npx vercel
   ```
   Sigue los pasos (link a tu repo si lo tienes, o deploy directo).
4. **Variable de entorno en Vercel:**  
   En el dashboard del proyecto → Settings → Environment Variables, añade:
   - `VITE_API_URL` = `https://tu-backend-en-render.com` (la URL de tu API, ver paso 2).

Cuando el backend esté desplegado, pon aquí esa URL **sin** `/api` al final (ej. `https://rookie-api.onrender.com`).

5. Vuelve a desplegar (Deployments → … → Redeploy) para que tome `VITE_API_URL`.

**URL final del frontend:** algo como `https://rokie-xxx.vercel.app`.

---

### 2. Backend (FastAPI) en Render (gratis) o Railway

#### Render (recomendado, gratis con límites)

1. Cuenta en [render.com](https://render.com).
2. New → **Web Service**.
3. Conecta tu repo (o sube el código).  
   - **Root Directory:** `backend` (solo la carpeta backend).
   - **Build Command:**  
     `pip install -r requirements.txt`  
     (o si no tienes `requirements.txt`: `pip install fastapi uvicorn sqlalchemy aiosqlite pydantic pydantic-settings python-jose passlib bcrypt python-multipart`)
   - **Start Command:**  
     `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment variables** (en Render):
     - `DATABASE_URL` = `sqlite+aiosqlite:///./rookie_erp.db` (para SQLite; en Render el disco es efímero, para datos persistentes luego puedes usar PostgreSQL).
     - Opcional: `SECRET_KEY` = una clave larga y aleatoria para producción.

4. **Variables de entorno** en Render:
   - `DATABASE_URL` = `sqlite+aiosqlite:///./rookie_erp.db` (para SQLite; en Render el disco es efímero).
   - `CORS_ORIGINS` = `https://rokie-xxx.vercel.app` (la URL de tu frontend en Vercel; si tienes varias, sepáralas por coma).
   - Opcional: `SECRET_KEY` = una clave larga y aleatoria para producción.

5. No hace falta tocar el código: el backend lee `CORS_ORIGINS` y permite esos orígenes. Guarda, commit y push; Render redespliega solo.

**URL del backend:** algo como `https://rookie-api.onrender.com`.  
Esa misma URL es la que pones en `VITE_API_URL` en Vercel (sin `/api`).

---

#### Railway (alternativa)

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub (selecciona el repo).
2. En Settings del servicio:
   - Root Directory: `backend`.
   - Build: `pip install -r requirements.txt` (o el comando que uses).
   - Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
3. Añade variables de entorno (DATABASE_URL, SECRET_KEY, **CORS_ORIGINS** = URL de tu frontend en Vercel).
4. El backend usa `CORS_ORIGINS` para permitir el frontend. Railway te da una URL pública para la API; esa es tu `VITE_API_URL`.

---

### 3. Base de datos y seed en producción

- Si usas **SQLite** en Render/Railway: el archivo se pierde al redeploy. Para tener usuarios y datos iniciales, después del primer deploy ejecuta el seed (desde tu PC apuntando a la API, o con un “one-off” job si el servicio lo permite).  
  En local, con el backend corriendo:  
  `cd backend && venv\Scripts\python.exe -m app.seed`
- Para **producción seria** conviene usar **PostgreSQL** (Render y Railway lo ofrecen). En ese caso:
  - En el panel creas una base PostgreSQL y copias `DATABASE_URL`.
  - En `backend/app/config.py` ya está soportado: `database_url: str = "postgresql+asyncpg://..."`.
  - Pones esa `DATABASE_URL` en las variables de entorno del backend y ejecutas el seed una vez (por ejemplo con un script o job que corra `python -m app.seed` contra esa base).

---

## Opción B — Arranque automático en Windows (sin internet)

Para que **al encender el PC** se levanten solos el frontend y el backend y puedas entrar en `http://localhost:5173` sin tocar el CMD.

### Método 1 — Carpeta de inicio de Windows

1. Crea un archivo **iniciar-rokie.bat** en tu escritorio (o donde quieras) con este contenido (ajusta la ruta si tu proyecto está en otra carpeta):

   ```bat
   @echo off
   cd /d C:\Users\norbe\Desktop\rokie
   start "Rookie Backend" cmd /k "cd backend && venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8001"
   timeout /t 3 /nobreak >nul
   start "Rookie Frontend" cmd /k "npm run dev --prefix frontend"
   ```

2. Copia (o mueve) **iniciar-rokie.bat** a la carpeta de inicio de Windows:
   - Pulsa `Win + R`, escribe `shell:startup` y Enter.
   - Pega el .bat ahí.

Cada vez que inicies sesión en Windows se abrirán dos ventanas de CMD (backend y frontend). Cuando aparezca “Local: http://localhost:5173” ya puedes abrir el navegador.

Para **no** arrancar la app al inicio: borra el .bat de la carpeta de inicio (o muévelo a otro sitio).

---

### Método 2 — Programador de tareas (Task Scheduler)

1. Abre **Programador de tareas** (busca “Programador de tareas” en el menú inicio).
2. Crear tarea básica:
   - Nombre: `Rookie Makers 3D`.
   - Desencadenador: “Al iniciar sesión”.
   - Acción: “Iniciar un programa”.
   - Programa: `C:\Users\norbe\Desktop\rokie\iniciar-rokie.bat` (usa el .bat del método 1).
   - Carpeta de inicio: `C:\Users\norbe\Desktop\rokie`.

Así la app se inicia automáticamente al iniciar sesión, sin tener que ejecutar el CMD a mano.

---

## Modo claro / modo oscuro (ya implementado)

- **Botón de tema:** En la barra superior (dentro de la app) y en la pantalla de login hay un botón con icono de **sol** (modo oscuro → clic para pasar a claro) o **luna** (modo claro → clic para pasar a oscuro).
- **Paleta:** Los colores se controlan con variables CSS en `frontend/src/index.css`:
  - `[data-theme="dark"]`: fondos oscuros, texto claro, acento azul.
  - `[data-theme="light"]`: fondos claros, texto oscuro, mismo acento en azul.
- La preferencia se guarda en **localStorage** (`rokie-theme`), así que se mantiene entre sesiones.

Si quieres cambiar colores, edita en `index.css` los bloques `[data-theme="light"]` y `[data-theme="dark"]` (variables `--theme-*`).

---

## Checklist rápido

- [ ] **Solo uso en casa, sin internet:** Opción B (inicio automático con .bat o Task Scheduler).
- [ ] **Quiero entrar desde cualquier sitio:** Opción A (Vercel + Render/Railway).
- [ ] Backend en producción: variable `CORS_ORIGINS` con la URL del frontend (ej. `https://tu-app.vercel.app`).
- [ ] Frontend en producción: `VITE_API_URL` apuntando a la URL del backend.
- [ ] Tema claro/oscuro: ya está; botón en header y en login.

Si sigues estos pasos, no tendrás que estar ejecutando el CMD a cada rato y, si despliegas, la página estará en línea en una URL fija.
