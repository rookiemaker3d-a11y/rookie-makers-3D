# Rookie Makers 3D - Web App (Next.js + Supabase)

Mini ERP para impresión 3D. Migrado desde la aplicación de escritorio Python/Tkinter.

## Requisitos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com)

## Configuración

1. **Supabase**
   - Crea un proyecto en Supabase.
   - En SQL Editor, ejecuta los scripts en orden:
     - `supabase/migrations/001_schema.sql` (esquema y RLS)
     - `supabase/migrations/002_seed.sql` (vendedores y servicios)
   - En Authentication > Users, crea el primer usuario administrador.
   - En SQL Editor, inserta su rol:
     ```sql
     insert into public.users_roles (user_id, role)
     values ('UUID_DEL_USUARIO_AUTH', 'administrador');
     ```
   - Para vincular vendedores a usuarios: crea usuarios en Auth y luego:
     ```sql
     insert into public.users_roles (user_id, role, vendedor_id)
     values ('UUID', 'vendedor', 'UUID_DEL_VENDEDOR');
     ```

2. **Variables de entorno**
   - Copia `.env.local.example` a `.env.local`.
   - Rellena `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` con los valores de tu proyecto (Settings > API).

3. **Instalación y ejecución**
   ```bash
   npm install
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000). Inicia sesión con el usuario administrador.

## Estructura

- **Dashboard:** Total Venta, Total Costo, Ganancia Neta (según productos autorizados; RLS por vendedor/admin).
- **Cotizaciones en espera:** Listado, nueva cotización (calculadora 3D), autorizar venta, generar PDF cotización/recibo, eliminar.
- **Productos autorizados:** Lista con totales, importar venta manual, eliminar.
- **Servicios:** Catálogo (admin), cotización de servicio (tarifa fija + por hora).
- **Clientes:** CRUD (admin); vendedores solo lectura.
- **Vendedores / Gastos:** Solo administrador (vendedores); gastos visibles por vendedor (solo los suyos) o todos (admin).

## Roles

- **administrador:** Acceso total; ve todos los datos; gestiona vendedores, clientes, servicios, gastos.
- **vendedor:** Ve solo sus cotizaciones, productos y gastos; puede crear cotizaciones y cotizaciones de servicio; no puede gestionar vendedores ni crear clientes/servicios (sí puede leer clientes y servicios).
