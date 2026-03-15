# Frontend en Render (todo en un solo lugar)

Sigue estos pasos para tener frontend + backend + PostgreSQL solo en Render.

---

## 1. Crear el Static Site del frontend en Render

1. Entra a [dashboard.render.com](https://dashboard.render.com).
2. **New +** → **Static Site**.
3. Conecta el mismo repo de GitHub: **rookiemaker3d-a11y/rookie-makers-3D** (o el que uses). Branch: **main**.
4. Configura:
   - **Name:** `rookie-makers-3d-frontend` (o el que quieras).
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
5. **Environment** (Environment Variables):
   - **Key:** `VITE_API_URL`
   - **Value:** `https://rookie-makers-3d.onrender.com`  
     (la URL de tu backend en Render, sin barra al final)
6. **Create Static Site**. Espera a que termine el primer deploy.

Cuando termine, Render te dará una URL tipo:  
`https://rookie-makers-3d-frontend.onrender.com`  
(según el nombre que hayas puesto).

---

## 2. CORS en el backend

1. En Render, abre tu servicio **rookie-makers-3D** (el backend).
2. **Environment** → Variables.
3. Añade o cambia:
   - **Key:** `CORS_ORIGINS`
   - **Value:** la URL del static site del paso 1, ej.  
     `https://rookie-makers-3d-frontend.onrender.com`  
     Si quieres permitir cualquier origen (incluidas previews): `*`
4. Guarda. Si no redespliega solo, haz **Manual Deploy** del backend.

---

## 3. Probar

Abre la URL del static site (ej. `https://rookie-makers-3d-frontend.onrender.com`) e inicia sesión con:

- **Correo:** `norbertomoro4@gmail.com`
- **Contraseña:** `admin123`

---

## Resumen

| Dónde        | Qué |
|-------------|-----|
| Render       | 3 cosas en el mismo dashboard: **PostgreSQL** (rookiemaker3d), **Backend** (rookie-makers-3D), **Frontend** (Static Site nuevo). |
| Vercel       | Ya no hace falta para este proyecto si usas el static de Render. |

Si el backend está en plan free y “duerme”, la primera carga puede tardar ~50 s; después debería ir normal.
