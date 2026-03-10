# Cambios implementados y pendientes

## Última actualización: Inventario, Videos (solicitud/aprobación), Editor página pública

### Módulo Inventario (materiales / materias primas)
- Nueva página **Inventario** con CRUD de ítems (nombre, descripción, cantidad, unidad).
- **Vendedor:** solo ve y edita/elimina los ítems que él ha subido.
- **Admin:** ve todo el inventario; puede agregar ítems (con o sin vendedor) y editar/eliminar cualquiera.
- Backend: `GET/POST /api/inventario`, `PATCH/DELETE /api/inventario/{id}` con permisos por rol.

### Videos promocionales – flujo de solicitud y aprobación
- **Vendedores** envían una *solicitud* (título, URL, red); el video queda en estado "Solicitud" hasta que el admin lo apruebe.
- **Admin** ve todos los videos (solicitudes y aprobados), puede hacer clic en **Aprobar** para publicar una solicitud, y puede agregar/editar/eliminar.
- En la lista se muestra estado (Solicitud / Aprobado) y solicitante.
- En la página pública (Proyectos) solo se muestran los videos **aprobados** (o con estado null por compatibilidad).

### Editor de página pública (solo administrador)
- Nueva página **Editor página pública**: cambiar tamaño de título (px), tamaño de subtítulo (px), color de fondo (CSS) y categorías (oficina, escuela, industrial, hogar, otros).
- Backend: `GET /api/pagina-publica/config` (público), `PUT /api/pagina-publica/config` (solo admin).

### Página Proyectos (landing)
- Carga la configuración desde la API y aplica en la landing: color de fondo, tamaños de título y subtítulo en el hero, y muestra las categorías configuradas como etiquetas en la sección Galería.

---

## Implementado en sesiones anteriores

### Estilos (modo claro y contornos)
- Variables de tema en **modo claro** con mejor contraste: bordes más visibles (`--theme-table-border`, `--theme-border`), cabeceras de tabla `#e2e8f0`.
- Clases **`.btn-primary`** (verde) y **`.btn-secondary`** para botones visibles en ambos temas.
- Botón "Importar venta" en Productos usa `btn-primary`; modales con bordes y botones consistentes.
- Tablas con borde `border-2` y colores que responden al tema.

### Vendedores (solo administrador)
- El módulo **Vendedores** solo aparece en el menú para **administrador**; los vendedores no lo ven ni pueden abrirlo (redirección a home si intentan la URL).
- El administrador puede **editar** cada vendedor: nombre, correo, teléfono, banco, cuenta.
- El administrador puede **cambiar la contraseña** de cualquier usuario desde el formulario de edición de vendedor (campo "Nueva contraseña"; si se deja vacío no se cambia).
- Backend: `GET /vendedores` y `PATCH /vendedores/:id` solo para admin; `PATCH /auth/users/:id/password` para cambiar contraseña (admin).

### Productos
- **Vendedores** ven la lista de productos y pueden usarlos para cotizaciones; **no** pueden importar ventas ni eliminar (no ven el botón "Importar venta" ni la columna Eliminar).
- **Solo el administrador** puede importar ventas y eliminar productos.
- Backend: `POST` y `DELETE` productos requieren rol administrador.

### Análisis
- **Administrador**: ve todos los datos (ingresos totales, pedidos, gráficas, cotizaciones).
- **Vendedor**: ve solo **sus** ventas y sus cotizaciones (totals, productos y cotizaciones filtrados por su nombre).
- Subtítulo en la página: "Resumen ejecutivo (todos los datos)" vs "Tus ventas y estadísticas personales".

### Cotizaciones en espera
- **Administrador**: ve todas las cotizaciones.
- **Vendedor**: ve solo sus propias cotizaciones en el pipeline.

### Dashboard
- El enlace "Vendedores" en acciones rápidas solo se muestra para el administrador.

---

## Pendiente (para siguientes iteraciones)

1. **Chatbot y generador de cotizaciones:**
   - Integración con herramienta tipo n8n (gratuita). Opciones: **n8n** (self‑hosted gratis), **Windmill** (open source), **Trigger.dev** (tier gratis).

---

## Cómo probar

- **Modo claro**: alternar tema en el header y revisar Productos, Vendedores, Clientes, Análisis (botones y tablas visibles).
- **Admin**: login con `norbertomoro4@gmail.com` / `admin123` → ver menú Vendedores, Inventario, Editor página pública; aprobar videos; editar vendedores y contraseñas; importar/eliminar productos; ver todo en Análisis.
- **Vendedor**: login con `rookiemaker3d@gmail.com` / `vendedor123` → ver Inventario (solo lo suyo), enviar solicitudes de video; no ver Vendedores ni Editor página pública; ver solo sus datos en Análisis.
