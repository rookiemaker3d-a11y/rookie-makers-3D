# Cómo arreglar la página en blanco/negra en Vercel

Sigue estos pasos **en orden**. Después de cada cambio en Vercel, espera a que termine el deploy y prueba de nuevo la URL.

---

## Paso 1: Revisar la carpeta raíz del proyecto en Vercel

1. Entra a [vercel.com](https://vercel.com) y abre tu proyecto **rookie-makers-3-d**.
2. Ve a **Settings** (Configuración).
3. En el menú izquierdo, entra a **General**.
4. Busca **Root Directory** (Carpeta raíz).

   **Tienes dos opciones válidas:**

   **Opción A – Usar la carpeta `frontend` (recomendado)**  
   - Activa **Edit** en Root Directory.  
   - Escribe: **`frontend`** (solo esa palabra, sin barras).  
   - Guarda (**Save**).  
   - Con esto Vercel construye solo el frontend y usa su `vercel.json`.

   **Opción B – Dejar Root Directory vacío**  
   - Si Root Directory está **vacío**, Vercel usa el `vercel.json` de la raíz del repo, que ya está configurado para instalar y construir dentro de `frontend`.  
   - No cambies nada ahí y sigue al Paso 2.

---

## Paso 2: Forzar un nuevo deploy

1. En el proyecto, ve a **Deployments** (Despliegues).
2. En el último deployment (el de arriba), haz clic en los **tres puntos (⋮)**.
3. Elige **Redeploy** (Redesplegar).
4. Marca **Use existing Build Cache** si quieres, o desmárcala para una build limpia.
5. Confirma con **Redeploy**.
6. Espera a que el estado pase a **Ready** (unos 1–2 minutos).

---

## Paso 3: Probar la página

1. Haz clic en **Visit** (Visitar) o abre en el navegador:  
   **https://rookie-makers-3-d.vercel.app**
2. Deberías ver primero “Cargando Rookie Makers 3D…” y luego la app (login o la página que toque).
3. Si sigue en blanco o negro:
   - Abre **Deployments** → el último deploy → **Building** / **Logs**.
   - Revisa si hay errores en la build (líneas en rojo). Si los hay, copia el mensaje y revísalo.

---

## Paso 4: Variable para que el login funcione (backend)

Para que el login no diga “No se pudo conectar al servidor”:

1. En Vercel, en tu proyecto → **Settings** → **Environment Variables**.
2. Añade:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://rookie-makers-3d.onrender.com`  
     (usa la URL real de tu backend en Render si es otra.)
3. Aplica a **Production** (y Preview si quieres).
4. Guarda y haz otro **Redeploy** (Paso 2) para que la variable se aplique.

---

## Resumen

| Dónde   | Qué hacer |
|--------|-----------|
| Vercel | Root Directory = **`frontend`** O dejarlo vacío (repo con `vercel.json` en raíz). |
| Vercel | **Redeploy** después de cambiar Root Directory o variables. |
| Vercel | Añadir **VITE_API_URL** = URL de tu backend en Render. |
| Render | **CORS_ORIGINS** = `*` o `https://rookie-makers-3-d.vercel.app`. |

Si tras el redeploy sigue en blanco, revisa los **logs de la build** en ese deployment y comparte el error que salga.
