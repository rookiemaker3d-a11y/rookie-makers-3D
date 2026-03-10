-- Rookie Makers 3D - Schema and RLS
-- Run this in Supabase SQL Editor (or via supabase db push)

-- Vendedores (maestro)
create table if not exists public.vendedores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  correo text not null unique,
  telefono text,
  banco text,
  cuenta text,
  created_at timestamptz default now()
);

-- Clientes
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  correo text not null,
  telefono text,
  direccion text,
  created_at timestamptz default now()
);

-- Servicios (tarifa fija + por hora)
create table if not exists public.servicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tarifa_fija numeric(12,2) default 0,
  tarifa_por_hora numeric(12,2) default 0,
  created_at timestamptz default now()
);

-- Cotizaciones en espera (impresión 3D)
create table if not exists public.cotizaciones_en_espera (
  id uuid primary key default gen_random_uuid(),
  vendedor_id uuid references public.vendedores(id) on delete set null,
  vendedor_nombre text not null,
  descripcion text not null,
  cantidad numeric(12,2) default 1,
  costo_base numeric(12,2) default 0,
  costo_final numeric(12,2) default 0,
  fecha date default current_date,
  detalles jsonb default '{}',
  created_at timestamptz default now()
);

-- Productos autorizados / ventas
create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  vendedor_id uuid references public.vendedores(id) on delete set null,
  vendedor_nombre text,
  descripcion text not null,
  costo_base numeric(12,2) default 0,
  costo_final numeric(12,2) default 0,
  cantidad numeric(12,2) default 1,
  detalles jsonb default '{}',
  created_at timestamptz default now()
);

-- Cotizaciones de servicio
create table if not exists public.cotizaciones_servicios (
  id uuid primary key default gen_random_uuid(),
  vendedor_id uuid references public.vendedores(id) on delete set null,
  items jsonb not null default '[]',
  created_at timestamptz default now()
);

-- Recibos de venta
create table if not exists public.recibos_venta (
  id uuid primary key default gen_random_uuid(),
  vendedor_id uuid references public.vendedores(id) on delete set null,
  vendedor_nombre text,
  items jsonb not null default '[]',
  total numeric(12,2) default 0,
  fecha date default current_date,
  created_at timestamptz default now()
);

-- Gastos
create table if not exists public.gastos (
  id uuid primary key default gen_random_uuid(),
  concepto text not null,
  monto numeric(12,2) not null,
  fecha date default current_date,
  vendedor_id uuid references public.vendedores(id) on delete set null,
  notas text,
  created_at timestamptz default now()
);

-- Users roles (auth.users -> vendedor or admin)
create table if not exists public.users_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  role text not null check (role in ('administrador','vendedor')),
  vendedor_id uuid references public.vendedores(id) on delete set null,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_cotizaciones_en_espera_vendedor on public.cotizaciones_en_espera(vendedor_id);
create index if not exists idx_productos_vendedor on public.productos(vendedor_id);
create index if not exists idx_productos_created_at on public.productos(created_at);
create index if not exists idx_gastos_fecha on public.gastos(fecha);
create index if not exists idx_users_roles_user_id on public.users_roles(user_id);

-- Enable RLS on all tables
alter table public.vendedores enable row level security;
alter table public.clientes enable row level security;
alter table public.servicios enable row level security;
alter table public.cotizaciones_en_espera enable row level security;
alter table public.productos enable row level security;
alter table public.cotizaciones_servicios enable row level security;
alter table public.recibos_venta enable row level security;
alter table public.gastos enable row level security;
alter table public.users_roles enable row level security;

-- Helper: get current user role and vendedor_id
create or replace function public.get_my_role()
returns text as $$
  select role from public.users_roles where user_id = auth.uid();
$$ language sql security definer stable;

create or replace function public.get_my_vendedor_id()
returns uuid as $$
  select vendedor_id from public.users_roles where user_id = auth.uid();
$$ language sql security definer stable;

-- users_roles: only allow read of own row
create policy "Users can read own role" on public.users_roles
  for select using (auth.uid() = user_id);

-- vendedores: admin all; vendedor read only (to see own profile)
create policy "Admin all vendedores" on public.vendedores
  for all using (public.get_my_role() = 'administrador');
create policy "Vendedor read vendedores" on public.vendedores
  for select using (id = public.get_my_vendedor_id());

-- clientes: admin all; vendedor read only
create policy "Admin all clientes" on public.clientes
  for all using (public.get_my_role() = 'administrador');
create policy "Vendedor read clientes" on public.clientes
  for select using (true);

-- servicios: admin all; vendedor read only
create policy "Admin all servicios" on public.servicios
  for all using (public.get_my_role() = 'administrador');
create policy "Vendedor read servicios" on public.servicios
  for select using (true);

-- cotizaciones_en_espera: admin all; vendedor own rows
create policy "Admin all cotizaciones_en_espera" on public.cotizaciones_en_espera
  for all using (public.get_my_role() = 'administrador');
create policy "Vendedor own cotizaciones_en_espera" on public.cotizaciones_en_espera
  for all using (vendedor_id = public.get_my_vendedor_id());

-- productos: admin all; vendedor own rows
create policy "Admin all productos" on public.productos
  for all using (public.get_my_role() = 'administrador');
create policy "Vendedor own productos" on public.productos
  for all using (vendedor_id = public.get_my_vendedor_id());

-- cotizaciones_servicios: admin all; vendedor own rows
create policy "Admin all cotizaciones_servicios" on public.cotizaciones_servicios
  for all using (public.get_my_role() = 'administrador');
create policy "Vendedor own cotizaciones_servicios" on public.cotizaciones_servicios
  for all using (vendedor_id = public.get_my_vendedor_id());

-- recibos_venta: admin all; vendedor own rows
create policy "Admin all recibos_venta" on public.recibos_venta
  for all using (public.get_my_role() = 'administrador');
create policy "Vendedor own recibos_venta" on public.recibos_venta
  for all using (vendedor_id = public.get_my_vendedor_id());

-- gastos: admin all; vendedor own rows only
create policy "Admin all gastos" on public.gastos
  for all using (public.get_my_role() = 'administrador');
create policy "Vendedor own gastos" on public.gastos
  for all using (vendedor_id = public.get_my_vendedor_id());
