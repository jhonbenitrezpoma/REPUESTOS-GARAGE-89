-- =====================================================================
--  INVENTARIO DE REPUESTOS DE MOTOS  -  Esquema para Supabase (Postgres)
--  Pégalo completo en: Supabase > SQL Editor > New query > Run
--  Se puede ejecutar de nuevo sin romper nada (usa IF NOT EXISTS / upsert).
-- =====================================================================

-- ---------- 1. Tablas ----------
create table if not exists public.marcas (
  id     bigint generated always as identity primary key,
  nombre text not null unique
);

create table if not exists public.categorias (
  id     bigint generated always as identity primary key,
  nombre text not null unique
);

create table if not exists public.repuestos (
  codigo        text primary key,
  nombre        text not null,
  marca_id      bigint not null references public.marcas(id),
  categoria_id  bigint not null references public.categorias(id),
  tipo          text   not null default 'ORIGINAL' check (tipo in ('ORIGINAL','ALTERNO')),
  fabricante    text,
  modelos       text,                 -- modelos compatibles, separados por coma
  precio        numeric(12,2) not null check (precio >= 0),
  stock         integer       not null default 0 check (stock >= 0),
  stock_minimo  integer       not null default 2 check (stock_minimo >= 0),
  ubicacion     text,
  imagen_url    text,
  creado        timestamptz   not null default now()
);

create table if not exists public.movimientos (
  id               bigint generated always as identity primary key,
  codigo           text not null references public.repuestos(codigo) on update cascade on delete cascade,
  tipo             text not null check (tipo in ('ENTRADA','SALIDA','AJUSTE')),
  cantidad         integer not null check (cantidad >= 0),   -- en AJUSTE = nuevo stock
  stock_resultante integer,
  nota             text,
  usuario          text,
  fecha            timestamptz not null default now()
);

create table if not exists public.perfiles (
  id     uuid primary key references auth.users(id) on delete cascade,
  nombre text,
  rol    text not null default 'CLIENTE' check (rol in ('ADMIN','CLIENTE'))
);

create index if not exists ix_repuestos_marca     on public.repuestos(marca_id);
create index if not exists ix_repuestos_categoria on public.repuestos(categoria_id);
create index if not exists ix_repuestos_nombre    on public.repuestos(nombre);
create index if not exists ix_movimientos_codigo  on public.movimientos(codigo, fecha desc);

-- ---------- 2. Perfil automático al registrarse ----------
create or replace function public.crear_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists trg_crear_perfil on auth.users;
create trigger trg_crear_perfil after insert on auth.users
for each row execute function public.crear_perfil();

-- ---------- 3. ¿Es administrador? ----------
create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfiles where id = auth.uid() and rol = 'ADMIN');
$$;

-- ---------- 4. Movimientos actualizan el stock ----------
create or replace function public.aplicar_movimiento() returns trigger
language plpgsql as $$
declare actual integer; nuevo integer;
begin
  select stock into actual from public.repuestos where codigo = new.codigo for update;
  if actual is null then raise exception 'Repuesto % no existe', new.codigo; end if;

  nuevo := case new.tipo
             when 'ENTRADA' then actual + new.cantidad
             when 'SALIDA'  then actual - new.cantidad
             else new.cantidad end;
  if nuevo < 0 then
    raise exception 'Stock insuficiente: hay % y se intenta sacar %', actual, new.cantidad;
  end if;

  update public.repuestos set stock = nuevo where codigo = new.codigo;
  new.stock_resultante := nuevo;
  new.usuario := coalesce(auth.jwt()->>'email', 'sistema');
  return new;
end $$;

drop trigger if exists trg_aplicar_movimiento on public.movimientos;
create trigger trg_aplicar_movimiento before insert on public.movimientos
for each row execute function public.aplicar_movimiento();

-- ---------- 5. Seguridad (Row Level Security) ----------
alter table public.marcas       enable row level security;
alter table public.categorias   enable row level security;
alter table public.repuestos    enable row level security;
alter table public.movimientos  enable row level security;
alter table public.perfiles     enable row level security;

-- Catálogo: lectura pública, escritura solo ADMIN
drop policy if exists marcas_leer      on public.marcas;
drop policy if exists marcas_admin     on public.marcas;
drop policy if exists categorias_leer  on public.categorias;
drop policy if exists categorias_admin on public.categorias;
drop policy if exists repuestos_leer   on public.repuestos;
drop policy if exists repuestos_admin  on public.repuestos;
drop policy if exists mov_admin        on public.movimientos;
drop policy if exists perfil_propio    on public.perfiles;
drop policy if exists perfil_admin     on public.perfiles;

create policy marcas_leer      on public.marcas     for select using (true);
create policy marcas_admin     on public.marcas     for all using (public.es_admin()) with check (public.es_admin());
create policy categorias_leer  on public.categorias for select using (true);
create policy categorias_admin on public.categorias for all using (public.es_admin()) with check (public.es_admin());
create policy repuestos_leer   on public.repuestos  for select using (true);
create policy repuestos_admin  on public.repuestos  for all using (public.es_admin()) with check (public.es_admin());

-- Movimientos: solo ADMIN (ver e insertar)
create policy mov_admin on public.movimientos for all using (public.es_admin()) with check (public.es_admin());

-- Perfiles: cada quien ve el suyo; el ADMIN ve todos. Nadie se puede auto-promover.
create policy perfil_propio on public.perfiles for select using (id = auth.uid());
create policy perfil_admin  on public.perfiles for all    using (public.es_admin()) with check (public.es_admin());

-- ---------- 6. Datos iniciales ----------
insert into public.marcas (nombre) values
  ('CF Moto'),
  ('Suzuki'),
  ('Bajaj'),
  ('Alternos')
on conflict (nombre) do nothing;

insert into public.categorias (nombre) values
  ('Motor'),
  ('Frenos'),
  ('Transmisión'),
  ('Eléctrico'),
  ('Suspensión'),
  ('Filtros y Lubricantes'),
  ('Carrocería'),
  ('Llantas y Rines')
on conflict (nombre) do nothing;

insert into public.repuestos (codigo,nombre,marca_id,categoria_id,tipo,fabricante,modelos,precio,stock,stock_minimo,ubicacion)
select v.codigo,v.nombre,m.id,c.id,v.tipo,v.fabricante,v.modelos,v.precio,v.stock,v.stock_minimo,v.ubicacion
from (values
  ('CFM-001', 'Pastillas de freno delanteras', 'CF Moto', 'Frenos', 'ORIGINAL', 'CF Moto', '150NK, 250NK, 300SR', 68000, 12, 4, 'A-01'),
  ('CFM-002', 'Pastillas de freno traseras', 'CF Moto', 'Frenos', 'ORIGINAL', 'CF Moto', '150NK, 250NK, 300SR', 54000, 9, 4, 'A-01'),
  ('CFM-003', 'Filtro de aceite', 'CF Moto', 'Filtros y Lubricantes', 'ORIGINAL', 'CF Moto', '250NK, 300SR, 450SR', 32000, 25, 8, 'B-02'),
  ('CFM-004', 'Kit de arrastre (cadena + piñón + catalina)', 'CF Moto', 'Transmisión', 'ORIGINAL', 'CF Moto', '250NK, 300NK', 285000, 4, 2, 'C-03'),
  ('CFM-005', 'Bujía iridium', 'CF Moto', 'Motor', 'ORIGINAL', 'CF Moto', '450SR, 650MT', 46000, 14, 6, 'B-01'),
  ('CFM-006', 'Disco de freno delantero', 'CF Moto', 'Frenos', 'ORIGINAL', 'CF Moto', '650MT, 650NK', 395000, 2, 2, 'A-02'),
  ('CFM-007', 'Retenedor de horquilla (par)', 'CF Moto', 'Suspensión', 'ORIGINAL', 'CF Moto', '250NK, 300SR', 78000, 6, 2, 'D-01'),
  ('CFM-008', 'Faro delantero LED', 'CF Moto', 'Eléctrico', 'ORIGINAL', 'CF Moto', '250NK', 520000, 1, 1, 'E-01'),
  ('SUZ-001', 'Pastillas de freno delanteras', 'Suzuki', 'Frenos', 'ORIGINAL', 'Suzuki', 'Gixxer 150, GN125, AX4', 42000, 18, 6, 'F-01'),
  ('SUZ-002', 'Filtro de aceite', 'Suzuki', 'Filtros y Lubricantes', 'ORIGINAL', 'Suzuki', 'Gixxer 150, DR650, V-Strom 650', 28000, 30, 10, 'F-02'),
  ('SUZ-003', 'Filtro de aire', 'Suzuki', 'Filtros y Lubricantes', 'ORIGINAL', 'Suzuki', 'GN125, Best 125', 24000, 15, 5, 'F-02'),
  ('SUZ-004', 'Kit de arrastre 428H', 'Suzuki', 'Transmisión', 'ORIGINAL', 'Suzuki', 'GN125, Best 125, AX4', 96000, 8, 3, 'G-01'),
  ('SUZ-005', 'Bobina de encendido', 'Suzuki', 'Eléctrico', 'ORIGINAL', 'Suzuki', 'Gixxer 150', 88000, 5, 2, 'H-01'),
  ('SUZ-006', 'Kit de empaques de motor', 'Suzuki', 'Motor', 'ORIGINAL', 'Suzuki', 'GN125', 112000, 3, 2, 'F-03'),
  ('SUZ-007', 'Amortiguador trasero (par)', 'Suzuki', 'Suspensión', 'ORIGINAL', 'Suzuki', 'GN125, AX4', 185000, 0, 2, 'G-02'),
  ('SUZ-008', 'Manigueta de freno', 'Suzuki', 'Frenos', 'ORIGINAL', 'Suzuki', 'Gixxer 150, GN125', 22000, 10, 4, 'F-04'),
  ('SUZ-009', 'Cadena de tiempo', 'Suzuki', 'Motor', 'ORIGINAL', 'Suzuki', 'DR650', 140000, 2, 1, 'F-03'),
  ('BAJ-001', 'Pastillas de freno delanteras', 'Bajaj', 'Frenos', 'ORIGINAL', 'Bajaj', 'Pulsar NS160, Pulsar 200NS, Dominar 400', 46000, 20, 6, 'J-01'),
  ('BAJ-002', 'Zapatas de freno traseras', 'Bajaj', 'Frenos', 'ORIGINAL', 'Bajaj', 'Boxer CT100, Platina 100, Discover 125', 19000, 28, 10, 'J-01'),
  ('BAJ-003', 'Kit de arrastre 428H', 'Bajaj', 'Transmisión', 'ORIGINAL', 'Bajaj', 'Pulsar NS160, Pulsar 180', 98000, 9, 3, 'K-01'),
  ('BAJ-004', 'Kit de arrastre 428 (CT100)', 'Bajaj', 'Transmisión', 'ORIGINAL', 'Bajaj', 'Boxer CT100, Platina 100', 72000, 11, 4, 'K-01'),
  ('BAJ-005', 'Filtro de aceite', 'Bajaj', 'Filtros y Lubricantes', 'ORIGINAL', 'Bajaj', 'Pulsar 200NS, Dominar 400', 26000, 22, 8, 'J-02'),
  ('BAJ-006', 'Clutch (juego de discos)', 'Bajaj', 'Transmisión', 'ORIGINAL', 'Bajaj', 'Pulsar NS160, Pulsar 200NS', 135000, 4, 2, 'K-02'),
  ('BAJ-007', 'Regulador / rectificador', 'Bajaj', 'Eléctrico', 'ORIGINAL', 'Bajaj', 'Pulsar NS160, Pulsar 200NS', 78000, 3, 2, 'L-01'),
  ('BAJ-008', 'Kit de pistón y anillos', 'Bajaj', 'Motor', 'ORIGINAL', 'Bajaj', 'Boxer CT100, Discover 125', 88000, 6, 2, 'K-03'),
  ('BAJ-009', 'Guaya de acelerador', 'Bajaj', 'Motor', 'ORIGINAL', 'Bajaj', 'Boxer CT100, Platina 100', 14000, 1, 4, 'K-04'),
  ('ALT-001', 'Bujía CR8E (compatible varias)', 'Alternos', 'Motor', 'ALTERNO', 'NGK', 'Pulsar 200NS, Gixxer 150, 250NK', 18000, 40, 15, 'M-01'),
  ('ALT-002', 'Aceite 20W-50 mineral 1L', 'Alternos', 'Filtros y Lubricantes', 'ALTERNO', 'Motul', 'Universal 4T', 42000, 36, 12, 'M-02'),
  ('ALT-003', 'Aceite 10W-40 sintético 1L', 'Alternos', 'Filtros y Lubricantes', 'ALTERNO', 'Castrol', 'Universal 4T', 58000, 24, 10, 'M-02'),
  ('ALT-004', 'Cadena 428H x 120 eslabones', 'Alternos', 'Transmisión', 'ALTERNO', 'DID', '125-160cc universal', 65000, 14, 5, 'N-01'),
  ('ALT-005', 'Pastillas de freno universales (delanteras)', 'Alternos', 'Frenos', 'ALTERNO', 'Vesrah', 'Pulsar, Gixxer, NK compatibles', 32000, 16, 6, 'N-02'),
  ('ALT-006', 'Llanta 90/90-17 trasera', 'Alternos', 'Llantas y Rines', 'ALTERNO', 'Pirelli', 'Pulsar, Gixxer, 150-200cc', 185000, 7, 3, 'P-01'),
  ('ALT-007', 'Llanta 110/70-17 delantera', 'Alternos', 'Llantas y Rines', 'ALTERNO', 'Michelin', 'Pulsar NS, 250NK, Gixxer', 240000, 5, 2, 'P-01'),
  ('ALT-008', 'Bombillo LED H4 (par)', 'Alternos', 'Eléctrico', 'ALTERNO', 'Osram', 'Universal', 48000, 20, 6, 'M-03'),
  ('ALT-009', 'Batería YTX7A-BS 12V', 'Alternos', 'Eléctrico', 'ALTERNO', 'Yuasa', 'GN125, Gixxer 150, Pulsar 180', 125000, 6, 3, 'M-04'),
  ('ALT-010', 'Espejos retrovisores (par)', 'Alternos', 'Carrocería', 'ALTERNO', 'Genérico', 'Universal 8mm/10mm', 36000, 18, 6, 'P-02')
) as v(codigo,nombre,marca,categoria,tipo,fabricante,modelos,precio,stock,stock_minimo,ubicacion)
join public.marcas m on m.nombre=v.marca
join public.categorias c on c.nombre=v.categoria
on conflict (codigo) do nothing;

-- ---------- 7. Volverte ADMIN ----------
-- 1) Crea tu usuario en Authentication > Users (o regístrate desde la página).
-- 2) Ejecuta esto con TU correo:
--
--   update public.perfiles set rol = 'ADMIN'
--   where id = (select id from auth.users where email = 'tu-correo@gmail.com');
