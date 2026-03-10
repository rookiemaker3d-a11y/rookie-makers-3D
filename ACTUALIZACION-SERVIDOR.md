# Transferencia de la actualización al servidor en línea

Esta guía describe cómo subir la **actualización de marzo 2025** (Inventario, Videos solicitud/aprobación, Editor de página pública) a producción (Vercel + Render).

---

## Resumen de la actualización

| Módulo | Descripción |
|--------|-------------|
| **Inventario** | Nueva página y API para materiales/materias primas. Vendedor solo ve/edita lo que él sube; admin ve todo. |
| **Videos promocionales** | Los vendedores envían *solicitudes* (título, URL, red); el admin las *aprueba* para que se muestren en la página pública. |
| **Editor página pública** | Solo admin: editar tamaños de título/subtítulo, color de fondo y categorías de la landing (Proyectos). |
| **Página Proyectos** | Usa la config del editor (fondos, tamaños, categorías) vía API pública. |

---

## Archivos modificados y nuevos

### Backend

| Ruta | Acción |
|------|--------|
| `app/main.py` | Registro de routers `inventario_router`, `pagina_publica_router`; corrección import `videos_routes`. |
| `app/api/videos_routes.py` | Lógica solicitud/aprobación; `/public` incluye `estado` null (compatibilidad). |
| `app/api/inventario_routes.py` | **Nuevo.** CRUD inventario con filtro por rol (admin todo, vendedor solo suyos). |
| `app/api/pagina_publica_routes.py` | **Nuevo.** GET/PUT `/pagina-publica/config` (público / solo admin). |
| `app/models/models.py` | Modelos `InventarioItem`, `PaginaPublicaConfig`; `VideoPromocional` con `estado`, `solicitante`. |
| `app/models/__init__.py` | Export de `InventarioItem`, `PaginaPublicaConfig`. |
| `app/schemas.py` | Schemas inventario y `PaginaPublicaConfigUpdate`. |

### Frontend

| Ruta | Acción |
|------|--------|
| `src/App.jsx` | Rutas `/inventario`, `/editor-pagina` (esta última con `AdminOnlyRoute`). |
| `src/components/Layout.jsx` | Enlaces de menú Inventario, Editor página pública (admin only). |
| `src/pages/Inventario.jsx` | **Nuevo.** CRUD inventario con permisos por rol. |
| `src/pages/EditorPaginaPublica.jsx` | **Nuevo.** Formulario admin: título, subtítulo, fondo, categorías. |
| `src/pages/VideosPromocionales.jsx` | Estado/solicitante, botón Aprobar (admin), formulario solicitud (vendedores). |
| `src/pages/Proyectos.jsx` | Carga config de la API y aplica estilos y categorías en la landing. |

---

## Base de datos en producción

Al arrancar, el backend ejecuta `init_db()` y hace `Base.metadata.create_all`, por lo que:

- Las tablas **nuevas** (`inventario`, `pagina_publica_config`) se crean solas en el primer despliegue después de esta actualización.
- No hace falta ejecutar migraciones a mano para esas dos tablas.

### Si ya tenías la tabla `videos_promocionales` (sin `estado` ni `solicitante`)

En una base **ya existente**, la tabla puede no tener las columnas `estado` y `solicitante`. En ese caso, después del deploy ejecuta en tu base PostgreSQL (Render → tu base → **Shell** o **Connect** con cliente) lo siguiente:

```sql
-- Añadir columnas si no existen (PostgreSQL)
ALTER TABLE videos_promocionales
  ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'aprobado',
  ADD COLUMN IF NOT EXISTS solicitante VARCHAR(255);
```

Si tu proveedor no soporta `ADD COLUMN IF NOT EXISTS`, usa:

```sql
ALTER TABLE videos_promocionales ADD COLUMN estado VARCHAR(20) DEFAULT 'aprobado';
ALTER TABLE videos_promocionales ADD COLUMN solicitante VARCHAR(255);
```

(Si alguna columna ya existe, ese ALTER fallará solo para esa línea; puedes ejecutar una por una.)

---

## Pasos para subir la actualización

### 1. Subir el código (Git → GitHub)

En la carpeta del proyecto:

```cmd
git add .
git commit -m "Inventario, videos solicitud/aprobación, editor página pública"
git push origin main
```

O ejecuta **SUBIR-CAMBIOS-ONLINE.bat** (ya lleva un mensaje de commit adecuado).

### 2. Vercel (frontend)

- Si el proyecto está conectado a GitHub, Vercel **redesplegará solo** al hacer push a `main`.
- Espera 1–3 minutos y comprueba en **https://rookie-makers-3-d.vercel.app** que aparezcan:
  - Menú **Inventario**
  - Menú **Editor página pública** (solo si entras como administrador)
  - En **Videos promocionales**: etiquetas Solicitud/Aprobado y botón **Aprobar** (admin).

### 3. Render (backend)

- Si el backend está conectado al mismo repo, Render **redesplegará solo** al detectar el push.
- Espera 2–5 minutos (plan gratis puede tardar más).
- Tras el deploy, las tablas `inventario` y `pagina_publica_config` existirán si la base ya estaba configurada con `DATABASE_URL`.
- Si la base ya tenía `videos_promocionales`, ejecuta el `ALTER TABLE` del apartado anterior si hace falta.

### 4. Comprobar en producción

| Prueba | Dónde | Qué ver |
|--------|--------|----------|
| Login admin | `/login` | Menú con Inventario y Editor página pública. |
| Inventario | `/inventario` | Lista vacía o ítems; admin ve todo, vendedor solo los suyos. |
| Videos | `/videos-promocionales` | Estado (Solicitud/Aprobado), solicitante; admin puede Aprobar. |
| Editor página | `/editor-pagina` | Formulario título, subtítulo, fondo, categorías (solo admin). |
| Landing | `/proyectos` | Estilos y categorías según lo guardado en el editor. |

---

## Variables de entorno (sin cambios)

No se añaden variables nuevas. Siguen siendo:

- **Vercel:** `VITE_API_URL` = `https://rookie-makers-3d.onrender.com`
- **Render (backend):** `CORS_ORIGINS` = `https://rookie-makers-3-d.vercel.app`, `DATABASE_URL` = Internal Database URL de PostgreSQL

---

## Resumen en una lista

| # | Dónde | Acción |
|---|--------|--------|
| 1 | PC | `git add .` → `git commit -m "..."` → `git push origin main` (o ejecutar SUBIR-CAMBIOS-ONLINE.bat) |
| 2 | Vercel | Esperar redeploy automático; revisar frontend en la URL de producción. |
| 3 | Render | Esperar redeploy automático del backend. |
| 4 | Render (opcional) | Si `videos_promocionales` ya existía sin `estado`/`solicitante`, ejecutar el ALTER en la base. |
| 5 | Navegador | Probar login, Inventario, Videos, Editor página pública y página Proyectos. |

---

## Referencia rápida de API nueva

| Método | Ruta | Quién | Descripción |
|--------|------|--------|-------------|
| GET | `/api/inventario` | Usuario autenticado | Lista (admin todo, vendedor solo suyos). |
| POST | `/api/inventario` | Usuario autenticado | Crear ítem (vendedor asigna su id). |
| PATCH | `/api/inventario/{id}` | Usuario (permiso por ítem) | Actualizar. |
| DELETE | `/api/inventario/{id}` | Usuario (permiso por ítem) | Eliminar. |
| GET | `/api/pagina-publica/config` | Público | Configuración landing (tamaños, fondo, categorías). |
| PUT | `/api/pagina-publica/config` | Solo admin | Guardar configuración. |
