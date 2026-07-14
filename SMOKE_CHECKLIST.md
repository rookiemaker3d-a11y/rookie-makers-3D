# Smoke Test ERP — Rookie Makers 3D

Checklist para verificar manualmente que cada módulo del ERP funciona tras un cambio.
Marcar ✅ cuando se verifique. Hacerlo tras cada deploy que toque backend o frontend ERP.

**URLs:** ERP → `https://api.rookiemakers3d.com/app/` · API → `https://api.rookiemakers3d.com/api/`
**Login de prueba:** usar un usuario vendedor Y uno administrador (para cubrir reglas por rol).

## Pre-flight
- [ ] `GET /api/health` → `{"status":"ok"}`
- [ ] `python -m pytest backend/tests/` → 0 failed (correrlo en la PC antes de deploy)
- [ ] `cd frontend && npm run build` → exit 0 (correrlo en la PC antes de deploy)

## Auth / Seguridad
- [ ] Login con credenciales válidas → entra al ERP.
- [ ] Login con contraseña incorrecta 3× → bloqueo temporal (rate limit).
- [ ] Login con usuario inexistente → mensaje de error, no 500.
- [ ] Token expirado / inválido → redirige a login (no deja navegar).
- [ ] MFA: activar → el QR se genera **localmente** (no sale del navegador) → confirmar con código → desactivar.
- [ ] Ruta protegida sin sesión → redirige a /login.
- [ ] Vendedor intenta entrar a página de admin (PerfilesAdmin/Seguridad) → bloqueado.

## Dashboard / Analisis
- [ ] Dashboard carga totales (ventas, cotizaciones, stock) sin números en blanco.
- [ ] Analisis cambia periodo (7 días / mes / 3 meses) → las gráficas y tablas actualizan.
- [ ] Analisis NO se queda en blanco si una API falla (simular: parar backend y recargar → muestra estado, no crash).

## Cotizador / Nueva cotización
- [ ] Crear cotización nueva (cliente + proyecto + piezas) → se guarda borrador.
- [ ] **NO se duplican** órdenes al enviar (verificar en BD: 1 fila por cliente+proyecto, no 2-3). ⚠️ bug histórico.
- [ ] PDF de cotización se genera y el **total es correcto** (probar cotización con total 0 / 100% descuento → muestra 0, no precioCliente). ⚠️ bug histórico.
- [ ] Avanzar/retroceder pasos del wizard sin perder datos.
- [ ] Subir anexo de foto (>3MB) → rechazado con mensaje, no cuelga.

## Cotizaciones en espera
- [ ] Lista carga todas las órdenes pendientes.
- [ ] Abrir una orden → carga sus detalles.
- [ ] Abrir A (lenta) y rápido B → el panel muestra B, no A desordenada (race).
- [ ] **Autorizar venta** → descuenta inventario correctamente, crea venta, elimina cotización. Probar con material que tiene **múltiples rollos** del mismo filamento. ⚠️ bug histórico.
- [ ] Autorizar venta con stock insuficiente → warning, no 500.

## Ventas
- [ ] Lista de ventas carga.
- [ ] Crear venta manual (productos, cantidades, costos) → botón se deshabilita durante el guardado (no doble submit). ⚠️
- [ ] Vendedor solo ve/edita SUS ventas; admin ve todas.
- [ ] Eliminar fila de producto del medio → los importes no se cruzan entre filas. ⚠️

## Inventario / Filamento
- [ ] Alta/baja/cambio de ítem de inventario → refleja en la lista.
- [ ] Consumir filamento (gramos) → descuenta del rollo correcto.
- [ ] Consumo rechazado (stock insuficiente) → muestra error, NO "Consumo registrado". ⚠️ falso-éxito.
- [ ] Cantidad negativa rechazada (validación ge=0). ⚠️
- [ ] Materiales filamento: listar/crear/editar.

## Productos / Catálogo
- [ ] Lista productos; filtrar por tab (Propios / Todos) → los totales (costo/venta/ganancia) reflejan SOLO lo filtrado. ⚠️
- [ ] Crear/editar/eliminar producto.
- [ ] Catálogo landing (admin) → editar y que se refleje en `https://www.rookiemakers3d.com`.

## Clientes / Vendedores
- [ ] Crear cliente → botón se deshabilita durante guardado (no duplicar). ⚠️
- [ ] Vendedores: editar datos + cambiar contraseña → si la contraseña falla, la tabla se recarga y avisa (no queda inconsistente). ⚠️
- [ ] Crear vendedor con correo ya existente → 400, no 500. ⚠️ (scalar_one_or_none fix)

## Suscripciones / Pagos
- [ ] Lista planes; solicitar pago (plan) → redirección MP correcta.
- [ ] Webhook MP: verificar que **no duplique** el crédito al recibir la misma notificación 2× (idempotencia). ⚠️ pendiente de fix.
- [ ] Comprar horas → suma horas_saldo.

## Landing pública (endpoints públicos)
- [ ] `POST /api/compras` con payload válido → 201 + email a Norberto + whatsapp_url.
- [ ] `POST /api/compras` con **mensaje con HTML** (`<a href=...>`) → el email lo recibe **escapado**, no como link clickable. ⚠️ (C5 fix)
- [ ] `POST /api/compras` con precio negativo → rechazado (422). ⚠️ pendiente schema.
- [ ] Catálogo público: `GET /api/catalogo/productos` → lista productos activos.
- [ ] Página pública y galería web cargan en www.

## Videos promocionales
- [ ] Cargar video con URL válida (https) → se guarda.
- [ ] Cargar video con URL `javascript:...` → **rechazado**. ⚠️ (XSS fix)
- [ ] Aprobar/eliminar como admin; vendedor solo sugiere.
- [ ] Acción sin permiso → mensaje de error (no "Video aprobado" falso). ⚠️

## Viewer 3D / STL / Calculadora
- [ ] Subir STL → vista 3D carga.
- [ ] Abrir viewer en dispositivo SIN WebGL → muestra mensaje de fallback (no pantalla blanca). ⚠️ (Viewer3D fix)
- [ ] Cerrar y reabrir varios STL → no se congela (memory leak). ⚠️
- [ ] Calculadora: cotizar pieza → guarda en espera.

## Alertas / Notificaciones
- [ ] Lista alertas; crear alerta manual.
- [ ] Notificación de filamento bajo se dispara y manda email (revisar bandeja).
- [ ] No se reenvían emails duplicados al reintentar el ciclo. ⚠️ pendiente.

## WhatsApp / Asistente
- [ ] Webhook de Meta responde 200 ONLY si `WHATSAPP_APP_SECRET` está configurado; si no, 403. ⚠️ pendiente.
- [ ] Asistente responde a mensaje de prueba.

## Configuración / Perfiles
- [ ] Cambiar tema/colores de la web pública → refleja en www.
- [ ] Perfiles: editar usuario, roles, activar/desactivar.

## Post-deploy
- [ ] `docker logs --tail 50 rookie-makers-3d-backend-1` sin tracebacks nuevos.
- [ ] Abrir 2-3 páginas al azar del ERP sin errores en consola del navegador (F12).