# Rookie Makers 3D - Mini ERP (Web)

Aplicación web: backend FastAPI + SQLite, frontend React + Tailwind. **Norberto (norbertomoro4@gmail.com) es el único administrador.** Login por vendedor/administrador, cálculo de costos, dashboard, videos promocionales y cotizador público.

## Comandos (Windows PowerShell)

**Terminal 1 — Backend**
```powershell
cd c:\Users\norbe\Desktop\rokie\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — Frontend**
```powershell
cd c:\Users\norbe\Desktop\rokie\frontend
npm install
npm run dev
```

Luego abre **http://localhost:5173**. Para entrar como admin (subir videos, etc.): **norbertomoro4@gmail.com** / **admin123**.

---

## Estructura

- `backend/` — API FastAPI, SQLite, JWT, generación PDF
- `frontend/` — React, Tailwind CSS, React Router

## Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
python -m app.seed       # Crea BD y usuarios iniciales
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Usuarios por defecto (tras `python -m app.seed`):**

- **Único administrador:** `norbertomoro4@gmail.com` / `admin123` (solo este puede agregar/editar/eliminar videos promocionales).
- **Vendedores:** `rookiemaker3d@gmail.com`, `rookiemakersd@gmail.com` / `vendedor123`

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Abre http://localhost:5173 y usa el proxy a la API en el mismo origen.

## Funcionalidad

- **Login:** JWT por rol (vendedor / administrador).
- **Costos:** Misma lógica que la calculadora desktop: margen 50%, costo filamento $500 MXN/kg (configurable en `backend/app/config.py`).
- **Dashboard:** Total costo, total venta y ganancia neta a partir de productos autorizados.
- **PDF:** Cotización o recibo en PDF descargable desde el navegador (endpoint `POST /api/pdf/cotizacion`).
- **Cotizaciones en espera:** Solo vendedores pueden crear; cualquier usuario autenticado puede autorizar venta (pasar a productos) y generar PDF.

## Variables de entorno (backend)

Opcional: crea `backend/.env`:

- `SECRET_KEY` — Clave para JWT (por defecto hay una de desarrollo).
- `DATABASE_URL` — Por defecto SQLite en `./rookie_erp.db`. Para PostgreSQL: `postgresql+asyncpg://user:pass@host/db`.
- `LOGO_PATH` — Ruta al logo para el PDF (opcional).
