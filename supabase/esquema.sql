-- Tabla de compras de los cursos de abletonfacil.
-- Se pega una sola vez en Supabase → SQL Editor → Run.

create table if not exists public.compras (
  id bigint generated always as identity primary key,
  correo text not null,
  compra text not null,            -- slug del curso o del pack
  sesion_stripe text unique,       -- para no apuntar dos veces el mismo pago
  importe numeric,
  creada timestamptz not null default now()
);

create index if not exists compras_correo on public.compras (lower(correo));

-- Cada alumno solo puede ver sus propias compras. Nadie puede escribir desde
-- la web: solo la función de Netlify (con la clave de servicio).
alter table public.compras enable row level security;

drop policy if exists "ver mis compras" on public.compras;
create policy "ver mis compras" on public.compras
  for select to authenticated
  using (lower(correo) = lower(auth.jwt() ->> 'email'));

grant select on public.compras to authenticated;

-- Para dar acceso a mano (un regalo, un alumno antiguo…):
-- insert into public.compras (correo, compra) values ('alumno@correo.com', 'groove-y-swing');
