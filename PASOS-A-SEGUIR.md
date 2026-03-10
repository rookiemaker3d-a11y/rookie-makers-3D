# Pasos a seguir (con lo que ya tienes)

**Ya tienes:** frontend en Vercel (`rookie-makers-3-d.vercel.app`) y backend en Render (`rookie-makers-3d.onrender.com`).

Sigue estos pasos **en orden**. No saltes ninguno.

---

## Paso 1 — En Vercel: que la web sepa la URL del backend

1. Entra en **https://vercel.com** e inicia sesión.
2. Clic en el proyecto **rookie-makers-3-d**.
3. Arriba, pestaña **Settings**.
4. En el menú izquierdo, **Environment Variables**.
5. Mira si existe la variable **VITE_API_URL**:
   - **Si existe:** edítala. El valor debe ser exactamente (sin `/api` al final):
     ```text
     https://rookie-makers-3d.onrender.com
     ```
   - **Si no existe:** clic en **Add** (o **Add New**). Name: `VITE_API_URL`, Value: `https://rookie-makers-3d.onrender.com`. Marca al menos **Production**.
6. Guarda.
7. Para que el cambio aplique, hay que redesplegar: pestaña **Deployments** → en el último deployment, los tres puntos **⋯** → **Redeploy** → confirmar. Espera 1–2 minutos.

---

## Paso 2 — En Render: que el backend acepte peticiones desde tu web (CORS)

1. Entra en **https://render.com** e inicia sesión.
2. Clic en tu **Web Service** **rookie-makers-3D**.
3. En el menú izquierdo, **Environment** (o **Environment Variables**).
4. Busca **CORS_ORIGINS**:
   - **Si existe:** edítala. El valor debe ser exactamente (sin barra final):
     ```text
     https://rookie-makers-3-d.vercel.app
     ```
   - **Si no existe:** **Add Environment Variable**. Key: `CORS_ORIGINS`, Value: `https://rookie-makers-3-d.vercel.app`.
5. Guarda. Render redesplegará solo; espera a que termine.

Con el Paso 1 y 2, la web ya puede hablar con el backend. Si aún no tienes usuarios en la base, el login fallará con “Correo o contraseña incorrectos”. Para crear usuarios sigue del Paso 3 en adelante.

---

## Paso 3 — En Render: crear la base PostgreSQL (solo una vez)

1. Sigue en **https://render.com**. En el panel principal (donde ves “My Workspace” o tu proyecto), clic en **New +** (arriba a la derecha).
2. Elige **Postgres** (icono de base de datos / elefante).
3. **Qué poner en cada campo del formulario “New Postgres”:**

   | Campo | Qué poner | Explicación |
   |-------|-----------|-------------|
   | **Name** | `rookiemaker3d` o `rookie-db` | Nombre que verás en el listado de Render. Cualquiera de los dos vale. |
   | **Project** (opcional) | Deja **My project** y **Production** como están | Agrupa la base con tu proyecto. No hace falta cambiar nada. |
   | **Database** (opcional) | Déjalo **en blanco** | Render generará un nombre (ej. `rookiemaker3d`). Si lo rellenas, usa algo como `rookie_db`. |
   | **User** (opcional) | Déjalo **en blanco** | Render creará un usuario automático. La contraseña la verás después en la URL. |
   | **Region** | **Oregon (US West)** | Déjalo así; tu backend ya está en Oregon y así se conectan por red interna. |
   | **PostgreSQL Version** | **16** | Déjalo en 16. |
   | **Datadog API Key** (opcional) | **Déjalo vacío** | Solo si usas Datadog; si no, no pongas nada. |

4. Clic en **Create Database** (o **Create**, el botón al final del formulario).
5. Espera 1–2 minutos hasta que el estado sea **Available** (verde).
6. Entra en esa base (clic en su nombre). En la pantalla verás una sección **Connections** (o **Connect**) con varias URLs.
7. **Copia** la **Internal Database URL** (la necesitas para el Paso 4). Ejemplo de formato:
   ```text
   postgresql://rookie_db_user:XXXXXXXX@dpg-xxxxx-a.oregon-postgres.render.com/rookie_db
   ```
8. En la misma pantalla, **copia** también la **External Database URL** (la necesitas para el Paso 6). Guárdala en un bloc de notas.

---

## Paso 4 — En Render: que el backend use esa base

1. En Render, vuelve a tu **Web Service** **rookie-makers-3D** (no a la base).
2. **Environment** (menú izquierdo).
3. Busca **DATABASE_URL**:
   - Si existe (con algo tipo `sqlite+aiosqlite...`), **edítala**.
   - Si no existe, **Add Environment Variable**.
4. **Key:** `DATABASE_URL`  
   **Value:** pega aquí la **Internal Database URL** que copiaste en el Paso 3 (la que empieza por `postgresql://...` y tiene un host tipo `dpg-xxxxx.oregon-postgres.render.com`). No la cambies a `postgresql+asyncpg` aquí; déjala tal cual.
5. Guarda. Render redesplegará el backend; espera a que termine.

---

## Paso 5 — En tu PC: instalar asyncpg (si no lo hiciste)

1. Abre **CMD** (Win + R → `cmd` → Enter).
2. Ejecuta:
   ```cmd
   cd c:\Users\norbe\Desktop\rokie\backend
   venv\Scripts\pip.exe install asyncpg
   ```
3. Cuando termine, no cierres la ventana.

---

## Paso 6 — En tu PC: preparar la URL para el seed

1. Abre la **External Database URL** que guardaste en el Paso 3. Tiene esta forma:
   ```text
   postgresql://usuario:contraseña@host/database
   ```
2. Cámbiala **solo al inicio**: de `postgresql://` a `postgresql+asyncpg://`. El resto igual.  
   Ejemplo:
   - Antes: `postgresql://rookie_db_user:Abc123@dpg-xxx.oregon-postgres.render.com/rookie_db`
   - Después: `postgresql+asyncpg://rookie_db_user:Abc123@dpg-xxx.oregon-postgres.render.com/rookie_db`
3. Si la **contraseña** tiene caracteres como `#`, `@`, `%`, `?`, `/`, codifícalos en la URL (ej. `#` → `%23`). Puedes usar https://www.urlencoder.org/ solo para la contraseña y pegarla en la URL.
4. Guarda esa URL final en el bloc de notas; la usarás en el Paso 7.

---

## Paso 7 — En tu PC: ejecutar el seed

1. En la **misma** ventana de CMD donde hiciste el Paso 5 (y donde estás en `c:\Users\norbe\Desktop\rokie\backend`).
2. Escribe (sustituye `TU_URL_AQUI` por la URL del Paso 6, entre comillas si tiene caracteres raros):
   ```cmd
   set "DATABASE_URL=TU_URL_AQUI"
   ```
   Ejemplo:
   ```cmd
   set "DATABASE_URL=postgresql+asyncpg://rookie_db_user:MiPass@dpg-abc123.oregon-postgres.render.com/rookie_db"
   ```
3. Enter. Luego ejecuta:
   ```cmd
   venv\Scripts\python.exe -m app.seed
   ```
4. Si todo va bien verás algo como:
   ```text
   Seed completado. Único admin: norbertomoro4@gmail.com / admin123
   Vendedores: correo del vendedor / vendedor123
   ```
5. Si sale error de conexión, revisa que la URL sea la **External** y que hayas puesto `postgresql+asyncpg://` y que la base en Render esté **Available**.

---

## Paso 8 — Probar el login

1. Abre en el navegador: **https://rookie-makers-3-d.vercel.app/login**
2. Si el backend en Render estaba dormido (plan gratis), la primera carga puede tardar ~50 segundos; espera o recarga.
3. Inicia sesión con:
   - **Correo:** `norbertomoro4@gmail.com`
   - **Contraseña:** `admin123`

Si algo falla, revisa: Vercel tiene `VITE_API_URL` = `https://rookie-makers-3d.onrender.com`, Render tiene `CORS_ORIGINS` = `https://rookie-makers-3-d.vercel.app`, y que hayas ejecutado el seed (Paso 7) sin errores.

---

## Resumen en una lista

| # | Dónde   | Qué hacer |
|---|--------|-----------|
| 1 | Vercel | Settings → Environment Variables → VITE_API_URL = `https://rookie-makers-3d.onrender.com` → Redeploy |
| 2 | Render | Web Service rookie-makers-3D → Environment → CORS_ORIGINS = `https://rookie-makers-3-d.vercel.app` |
| 3 | Render | New + → PostgreSQL → crear base → copiar Internal y External URL |
| 4 | Render | Web Service rookie-makers-3D → Environment → DATABASE_URL = Internal URL del paso 3 |
| 5 | PC CMD | `cd backend` → `venv\Scripts\pip.exe install asyncpg` |
| 6 | Bloc de notas | External URL → cambiar `postgresql://` a `postgresql+asyncpg://` |
| 7 | PC CMD | `set "DATABASE_URL=postgresql+asyncpg://..."` → `venv\Scripts\python.exe -m app.seed` |
| 8 | Navegador | rookie-makers-3-d.vercel.app/login → norbertomoro4@gmail.com / admin123 |

---

## Desarrollo local: reiniciar servidor y actualizar

Para **arrancar**, **reiniciar** el backend o saber **cuándo se aplican los cambios** en tu PC, usa la guía:

- **[DESARROLLO.md](DESARROLLO.md)** — cómo ejecutar `npm run start`, reiniciar backend (Ctrl+C y volver a iniciar) y cómo el frontend se actualiza solo (hot reload).

---

## Subir una actualización al servidor en línea

Cuando tengas nuevos cambios (código, inventario, videos, editor de página, etc.) y quieras llevarlos a producción (Vercel + Render):

- **[ACTUALIZACION-SERVIDOR.md](ACTUALIZACION-SERVIDOR.md)** — resumen de la última actualización, archivos tocados, base de datos (tablas nuevas / ALTER si aplica) y pasos: git push, redeploy, y comprobaciones en producción.

También puedes usar **SUBIR-CAMBIOS-ONLINE.bat** para hacer `git add`, `commit` y `push` con un mensaje preparado; Vercel y Render redesplegarán solos si el repo está conectado.
