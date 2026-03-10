-- Expansión ERP: pedidos con estados, máquinas, inventario de materiales
-- Ejecutar en Supabase SQL Editor después de 001_schema.sql

-- Estados de pedido: cotizacion | confirmado | imprimiendo | post_proceso | entregado | cancelado
create type public.estado_pedido as enum (
  'cotizacion', 'confirmado', 'imprimiendo', 'post_proceso', 'entregado', 'cancelado'
);

-- Pedidos (reemplaza/amplía flujo cotizaciones → productos)
create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id) on delete set null,
  vendedor_id uuid references public.vendedores(id) on delete set null,
  descripcion text not null,
  material text,
  estado public.estado_pedido not null default 'cotizacion',
  fecha_entrega date,
  monto numeric(12,2) default 0,
  cantidad numeric(12,2) default 1,
  notas text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Máquinas de impresión
create table if not exists public.maquinas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  estado text not null default 'libre' check (estado in ('libre','ocupada','pausada','mantenimiento')),
  pedido_actual_id uuid references public.pedidos(id) on delete set null,
  progreso_porcentaje numeric(5,2) default 0,
  tiempo_inicio_impresion timestamptz,
  duracion_estimada_min integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Inventario de materiales (filamentos)
create table if not exists public.materiales (
  id uuid primary key default gen_random_uuid(),
  material text not null,
  color text,
  kg_disponibles numeric(10,3) default 0,
  punto_reorden numeric(10,3) default 0,
  proveedor text,
  unidad text default 'kg',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Historial de uso de material (descuentos al confirmar/completar pedidos)
create table if not exists public.material_uso (
  id uuid primary key default gen_random_uuid(),
  material_id uuid references public.materiales(id) on delete cascade,
  pedido_id uuid references public.pedidos(id) on delete set null,
  kg_usados numeric(10,3) not null,
  created_at timestamptz default now()
);

-- Compras de filamento
create table if not exists public.material_compras (
  id uuid primary key default gen_random_uuid(),
  material_id uuid references public.materiales(id) on delete cascade,
  kg numeric(10,3) not null,
  costo_total numeric(12,2),
  fecha date default current_date,
  notas text,
  created_at timestamptz default now()
);

-- Log de tiempo por máquina (horas operadas)
create table if not exists public.maquina_logs (
  id uuid primary key default gen_random_uuid(),
  maquina_id uuid references public.maquinas(id) on delete cascade,
  pedido_id uuid references public.pedidos(id) on delete set null,
  inicio timestamptz not null,
  fin timestamptz,
  estado text default 'activo'
);

-- Índices
create index if not exists idx_pedidos_cliente on public.pedidos(cliente_id);
create index if not exists idx_pedidos_estado on public.pedidos(estado);
create index if not exists idx_pedidos_fecha_entrega on public.pedidos(fecha_entrega);
create index if not exists idx_maquinas_estado on public.maquinas(estado);
create index if not exists idx_materiales_material on public.materiales(material);

-- RLS
alter table public.pedidos enable row level security;
alter table public.maquinas enable row level security;
alter table public.materiales enable row level security;
alter table public.material_uso enable row level security;
alter table public.material_compras enable row level security;
alter table public.maquina_logs enable row level security;

-- Políticas: admin todo; vendedor lee/escribe pedidos propios
create policy "Admin all pedidos" on public.pedidos for all using (public.get_my_role() = 'administrador');
create policy "Vendedor own pedidos" on public.pedidos for all using (vendedor_id = public.get_my_vendedor_id());

create policy "Admin all maquinas" on public.maquinas for all using (public.get_my_role() = 'administrador');
create policy "Vendedor read maquinas" on public.maquinas for select using (true);

create policy "Admin all materiales" on public.materiales for all using (public.get_my_role() = 'administrador');
create policy "Vendedor read materiales" on public.materiales for select using (true);

create policy "Admin all material_uso" on public.material_uso for all using (public.get_my_role() = 'administrador');
create policy "Admin all material_compras" on public.material_compras for all using (public.get_my_role() = 'administrador');
create policy "Admin all maquina_logs" on public.maquina_logs for all using (public.get_my_role() = 'administrador');

-- Notas internas por cliente (campo en clientes o tabla separada)
alter table public.clientes add column if not exists notas_internas text;
alter table public.clientes add column if not exists segmento text;
alter table public.clientes add column if not exists empresa text;
