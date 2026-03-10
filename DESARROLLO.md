# Desarrollo local: cómo arrancar, reiniciar y actualizar

## Arrancar todo (frontend + backend)

Desde la **raíz del proyecto** (`c:\Users\norbe\Desktop\rokie`):

```cmd
npm run start
```

Esto levanta:

- **Frontend (Vite):** en el puerto que Vite use por defecto (suele ser **5173**). Abre `http://localhost:5173`.
- **Backend (FastAPI/uvicorn):** en el puerto **8001**. La API queda en `http://localhost:8001` (docs: `http://localhost:8001/docs`).

Si no tienes dependencias instaladas:

```cmd
npm install
cd frontend && npm install && cd ..
cd backend && venv\Scripts\pip install -r requirements.txt
```

(Asume que en `backend` ya tienes un `venv` creado; si no: `python -m venv venv` y luego el `pip install`.)

---

## Cómo se actualizan los cambios

### Frontend (Vite)

- **No hace falta reiniciar.** Vite recarga solo al guardar archivos (hot reload).
- Si cambias algo en `frontend/src`, guarda y recarga la pestaña del navegador (o espera el recargo automático).
- Si cambias variables de entorno del frontend (`.env` con `VITE_*`), a veces hace falta **reiniciar** el comando `npm run start` para que las coja.

### Backend (FastAPI/uvicorn)

- **Sí hace falta reiniciar** cuando cambies código Python (`.py` en `backend/app`), middlewares, config o variables de entorno del backend.
- **Cómo reiniciar:**
  1. En la terminal donde está corriendo `npm run start`, pulsa **Ctrl+C** (una o dos veces) para parar todo.
  2. Vuelve a ejecutar:
     ```cmd
     npm run start
     ```
- Si solo levantas el backend en otra terminal:
  ```cmd
  cd backend
  venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8001
  ```
  Para aplicar cambios: **Ctrl+C** y volver a ejecutar el mismo comando.

---

## Resumen rápido

| Qué cambias              | Qué hacer                          |
|--------------------------|-------------------------------------|
| Código frontend (JS/JSX/CSS) | Guardar → se actualiza solo (hot reload). Si no, F5 en el navegador. |
| Variables `VITE_*` (frontend) | Reiniciar `npm run start`.          |
| Código backend (Python)  | Reiniciar backend (Ctrl+C y `npm run start` de nuevo). |
| Variables de entorno backend (`.env`) | Reiniciar backend.                  |

---

## Producción (Vercel + Render)

- **Vercel (frontend):** cada **push** a la rama que conectes (ej. `main`) dispara un nuevo deploy. Los cambios se ven cuando termina el deploy.
- **Render (backend):** igual: push a la rama conectada hace que Render redespliegue el servicio. No hay que “reiniciar” a mano; el reinicio lo hace Render al actualizar el código.

Si quieres forzar un redeploy sin cambiar código: en Vercel/Render, en el último deployment, usa la opción **Redeploy** (o “Clear build cache & deploy”).
