# Checklist para que funcione el login (Vercel + Render)

## 1. Backend en Render

- **Código**: El repo que conectas en Render debe tener los cambios de `backend/app/config.py` y `backend/app/database.py` (conversión a `postgresql+asyncpg://`). Haz push y espera a que el deploy termine.
- **Variables de entorno en Render**:
  - `DATABASE_URL`: la da Render si añadiste una base PostgreSQL (no la cambies).
  - **`CORS_ORIGINS`**: pon **`*`** (permite cualquier origen) o tu URL de Vercel, por ejemplo:
    - `https://rookie-makers-3-d.vercel.app`
    - o la URL que te dé Vercel (incluidas las de preview).
- **Comprobar**: Abre en el navegador `https://tu-servicio.onrender.com/api/health`. Debe responder `{"status":"ok"}`. Si no carga, el backend sigue fallando (revisa los logs en Render).

## 2. Frontend en Vercel

- **Variable de entorno**:
  - Nombre: **`VITE_API_URL`**
  - Valor: **URL de tu backend en Render**, por ejemplo: `https://rookie-makers-3d.onrender.com`
  - (Sin barra final. Sin `/api`.)
- Después de guardar la variable, haz un **nuevo deploy** (Redeploy) para que el frontend la use.

## 3. Resumen

| Dónde  | Variable       | Valor de ejemplo                          |
|--------|----------------|-------------------------------------------|
| Render | CORS_ORIGINS   | `*` o `https://rookie-makers-3-d.vercel.app` |
| Vercel | VITE_API_URL   | `https://rookie-makers-3d.onrender.com`    |

Si el backend arranca (sin error de psycopg2) y CORS y VITE_API_URL están bien, el login debería conectar.
