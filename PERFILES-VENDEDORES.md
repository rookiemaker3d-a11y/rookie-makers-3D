# Perfiles de vendedores

Este documento describe los perfiles de los **dos vendedores** (además del administrador) y cómo usarlos.

## Usuarios vendedores (seed)

| Nombre | Correo | Contraseña | Rol |
|--------|--------|------------|-----|
| Daniel Moreno Rodriguez | rookiemaker3d@gmail.com | vendedor123 | vendedor |
| Emanuel Fidel Ramirez Alamillo | rookiemakersd@gmail.com | vendedor123 | vendedor |

El **administrador** es:

| Nombre | Correo | Contraseña | Rol |
|--------|--------|------------|-----|
| Norberto Charbel Moreno Rodriguez | norbertomoro4@gmail.com | admin123 | administrador |

## Cómo inician sesión los vendedores

1. Ir a la pantalla de login del ERP.
2. **Correo:** el correo del vendedor (ej. `rookiemaker3d@gmail.com` o `rookiemakersd@gmail.com`).
3. **Contraseña:** `vendedor123` (misma para ambos vendedores; se puede cambiar después).

## Qué ven y qué pueden hacer

- **Vendedor:** puede usar el cotizador, ver clientes, ver y gestionar cotizaciones en espera (pipeline), ver productos y análisis según permisos del backend. **No** puede agregar/editar/eliminar videos promocionales (solo el administrador).
- **Administrador:** todo lo anterior más gestión de videos promocionales, y es el único que puede tener rol `administrador` (el seed asegura que solo Norberto sea admin).

## Notas

- Las contraseñas están hasheadas en la base de datos (bcrypt).
- Para cambiar contraseñas o agregar más vendedores, usar el seed o un endpoint de administración si existe.
