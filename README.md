# Rookie Makers 3D — ERP Web

Aplicación web para gestión de impresión 3D: dashboard, pedidos, producción, clientes, inventario, cotizador y finanzas.

## Stack

- Next.js 15, React 19, TypeScript
- Tailwind CSS, tema claro/oscuro (oscuro por defecto)
- Supabase (auth + base de datos)
- TanStack Query, Zustand, Framer Motion, Recharts, date-fns, Sonner

## Configuración

1. Clona el repo e instala dependencias:

```bash
npm install
```

2. Configura variables de entorno. Copia `.env.example` a `.env.local` y rellena:

- `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: clave anónima de Supabase

3. Ejecuta las migraciones en el SQL Editor de Supabase:

- `supabase/migrations/001_schema.sql` — tablas base (vendedores, clientes, cotizaciones, productos, gastos, auth)
- `supabase/migrations/002_erp_expansion.sql` — pedidos, máquinas, materiales/inventario

4. Arranca el servidor de desarrollo:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Si el puerto está ocupado, Next usará 3001 (http://localhost:3001).

**Si `npm run start` dice "address already in use":**

1. Ver qué proceso usa el 3000 (CMD):
```cmd
netstat -ano | findstr :3000
```
2. Anota el **PID** (último número de la línea LISTENING; en tu caso era **41664**).
3. Cierra ese proceso:
```cmd
taskkill /PID 41664 /F
```
(Sustituye 41664 por el PID que te salga.)
4. Vuelve a ejecutar:
```cmd
npm run start
```

Para usar otro puerto sin cerrar el 3000:
```cmd
npm run start:3001
```
Luego abre http://localhost:3001

## Módulos

- **Dashboard**: KPIs, gráfica de ingresos, últimos pedidos, alertas (stock bajo, retrasados), utilización de máquinas
- **Pedidos**: Tabla con filtros por estado y búsqueda; exportar CSV
- **Producción**: Cola por máquina (estado, progreso, tiempo restante)
- **Clientes**: Lista existente + enlace desde menú
- **Inventario**: Materiales/filamentos, kg, punto de reorden, barra de stock
- **Cotizador**: Tiempo impresión, gramos, horas diseño, margen; precio sugerido en tiempo real
- **Finanzas**: Ingresos vs egresos del mes, meta mensual, progreso
- **Calculadoras / Registro impresión**: Tabla tipo Excel para cotizaciones 3D (existente)

## Roles

- **administrador**: acceso a vendedores, gastos y todas las tablas
- **vendedor**: solo sus cotizaciones/productos; lectura de clientes y servicios
