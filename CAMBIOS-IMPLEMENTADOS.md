# Cambios implementados y pendientes

## Implementado en esta sesión

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

1. **Módulo Inventario** (materiales / materias primas, distinto de "Productos"):
   - CRUD de ítems de inventario; vendedor solo ve lo que él subió; admin ve todo.

2. **Videos promocionales – flujo de solicitud**:
   - Vendedores envían solicitud (enlace + info); el admin la recibe en su perfil y autoriza para que se publique.

3. **Editor de página pública** (Proyectos / landing):
   - Solo admin: cambiar tamaños de texto, fondos, estilos, categorías (oficina, escuela, industrial, etc.).

4. **Chatbot y generador de cotizaciones**:
   - Integración con herramienta tipo n8n (gratuita). Opciones que puedes valorar: **n8n** (self‑hosted gratis), **Windmill** (open source), **Trigger.dev** (tier gratis). Para módulo "free de por vida" self‑hosted: n8n o Windmill.

---

## Cómo probar

- **Modo claro**: alternar tema en el header y revisar Productos, Vendedores, Clientes, Análisis (botones y tablas visibles).
- **Admin**: login con `norbertomoro4@gmail.com` / `admin123` → ver menú Vendedores, editar vendedores y contraseñas, importar/eliminar productos, ver todo en Análisis.
- **Vendedor**: login con `rookiemaker3d@gmail.com` / `vendedor123` → no ver Vendedores en el menú, ver solo sus productos en Análisis, ver todos los productos en Productos pero sin botón Importar ni Eliminar.
