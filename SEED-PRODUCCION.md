# Cómo ejecutar el seed en producción (usuarios admin y vendedores)

El error `getaddrinfo failed` sale porque usaste la URL de ejemplo (`usuario:contraseña@host/dbname`). Tienes que usar **la URL real** de la base PostgreSQL de Render.

---

## Paso 1 — Crear la base PostgreSQL en Render (solo una vez)

1. Entra en **https://render.com** e inicia sesión.
2. En el panel, clic en **New +** (arriba) → **PostgreSQL**.
3. Configura:
   - **Name:** por ejemplo `rookie-db`.
   - **Database:** nombre de la base (ej. `rookie_db`); Render lo rellena.
   - **User** y **Region** los que prefieras (ej. Oregon).
4. Clic en **Create Database**.
5. Espera 1–2 minutos hasta que el estado sea **Available**.
6. En la pantalla de la base, busca **Connection** o **Connect**. Verás varias URLs:
   - **Internal Database URL** (recomendada si el backend está en Render).
   - **External Database URL** (para conectar desde fuera de Render, por ejemplo desde tu PC).
7. **Copia la External Database URL** (la necesitas para ejecutar el seed desde tu PC).  
   Tiene esta forma (ejemplo):
   ```text
   postgresql://rookie_db_user:ABCD1234xyz@dpg-xxxxxx-a.oregon-postgres.render.com/rookie_db
   ```
   No cierres esa pantalla; la usarás en el Paso 3.

---

## Paso 2 — Decirle al backend en Render que use esa base

1. En Render, abre tu **Web Service** del backend (rookie-api o como lo hayas nombrado).
2. Pestaña **Environment** (o **Environment Variables**).
3. Busca la variable **DATABASE_URL**.
   - Si existe (con SQLite), **edítala**.
   - Si no existe, **Add** una nueva.
4. Pega la **Internal Database URL** de la base PostgreSQL (la que empieza por `postgresql://...` y su host suele ser tipo `dpg-xxxxx-a.oregon-postgres.render.com`).  
   **Importante:** en Render el backend y la base están en la misma red, por eso se usa la **Internal** URL.
5. Guarda. Render redesplegará el backend solo; espera a que termine.

---

## Paso 3 — Convertir la URL a formato SQLAlchemy (asyncpg)

La URL que te da Render es:

```text
postgresql://usuario:contraseña@host/database
```

Para el seed desde tu PC (y para que SQLAlchemy use asyncpg) debe ser:

```text
postgresql+asyncpg://usuario:contraseña@host/database
```

Solo cambia el inicio: de `postgresql://` a `postgresql+asyncpg://`.  
El resto (usuario, contraseña, host, database) se deja igual.

**Si la contraseña tiene caracteres raros** (por ejemplo `#`, `@`, `?`, `%`, `/`), hay que codificarlos en la URL. Ejemplo:
- Contraseña original: `abc#123`  
- En la URL: `abc%23123` (el `#` se escribe `%23`).

Puedes usar una página como https://www.urlencoder.org/ para codificar solo la contraseña y luego pegarla en la URL.

Guarda la URL final en un bloc de notas; la usarás en el Paso 5.

---

## Paso 4 — Abrir CMD y llegar a la carpeta del backend

1. Pulsa **Win + R**, escribe `cmd`, Enter.
2. Ejecuta:

```cmd
cd c:\Users\norbe\Desktop\rokie\backend
```

Comprueba que estás en la carpeta correcta (debe existir la carpeta `app` y el archivo `requirements.txt`).

---

## Paso 5 — Poner la URL real en la variable DATABASE_URL

En la misma ventana de CMD, en **una sola línea** (sustituye por tu URL real):

```cmd
set "DATABASE_URL=postgresql+asyncpg://USUARIO:CONTRASEÑA@HOST/NOMBRE_BASE"
```

Ejemplo (es solo un ejemplo; tu URL será distinta):

```cmd
set "DATABASE_URL=postgresql+asyncpg://rookie_db_user:MiPass123@dpg-abc123.oregon-postgres.render.com/rookie_db"
```

Reglas:
- Usa comillas dobles `"..."` para que no falle si la contraseña tiene espacios o caracteres especiales.
- No dejes espacios antes ni después del `=`.
- Si la contraseña tiene `%`, `!` o `"`, en CMD puede ser complicado; en ese caso crea un archivo `.env` en `backend` con una sola línea:  
  `DATABASE_URL=postgresql+asyncpg://...`  
  y no uses `set` en CMD (el seed leerá el `.env`).

Comprueba que quedó guardada (opcional):

```cmd
echo %DATABASE_URL%
```

Deberías ver tu URL impresa.

---

## Paso 6 — Instalar asyncpg en el venv (si no lo has hecho)

En la misma CMD:

```cmd
venv\Scripts\pip.exe install asyncpg
```

Si ya lo instalaste antes, no pasa nada; pip dirá que ya está satisfecho.

---

## Paso 7 — Ejecutar el seed

En la misma CMD (sin cerrar la ventana, para que siga existiendo `DATABASE_URL`):

```cmd
venv\Scripts\python.exe -m app.seed
```

Si todo va bien verás algo como:

```text
Seed completado. Único admin: norbertomoro4@gmail.com / admin123
Vendedores: correo del vendedor / vendedor123
```

Si sale un error de conexión:
- Revisa que la URL sea la **External** (para conectar desde tu PC) y que tenga `postgresql+asyncpg://`.
- Comprueba que el host (ej. `dpg-xxxxx.oregon-postgres.render.com`) sea correcto y que la base en Render esté **Available**.
- Si la contraseña tiene caracteres especiales, pruébala codificada en la URL (Paso 3).

---

## Paso 8 — Probar el login en producción

1. Abre en el navegador la URL de tu app en Vercel (ej. `https://rookie-makers-3-d.vercel.app/login`).
2. Asegúrate de que el backend en Render esté en marcha y que en Vercel tengas **VITE_API_URL** apuntando a la URL del backend.
3. Inicia sesión con:
   - **Correo:** `norbertomoro4@gmail.com`
   - **Contraseña:** `admin123`

---

## Resumen rápido

| Paso | Dónde | Qué haces |
|------|--------|-----------|
| 1 | Render | New → PostgreSQL → crear base → copiar **External** URL |
| 2 | Render (Web Service backend) | Environment → DATABASE_URL = **Internal** URL de la base |
| 3 | Bloc de notas | Cambiar `postgresql://` → `postgresql+asyncpg://` en la External URL |
| 4 | CMD | `cd c:\Users\norbe\Desktop\rokie\backend` |
| 5 | CMD | `set "DATABASE_URL=postgresql+asyncpg://..."` (tu URL real) |
| 6 | CMD | `venv\Scripts\pip.exe install asyncpg` |
| 7 | CMD | `venv\Scripts\python.exe -m app.seed` |
| 8 | Navegador | Entrar en la app con norbertomoro4@gmail.com / admin123 |

La causa del error que tuviste fue usar `usuario:contraseña@host/dbname` en lugar de la URL real que te da Render en el Paso 1.
