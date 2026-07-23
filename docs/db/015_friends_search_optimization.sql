-- 015_friends_search_optimization.sql
-- Optimiza la busqueda de personas para agregar amistad:
-- - Indices de trigramas (pg_trgm) sobre full_name/username para que las
--   busquedas por ILIKE "contiene" (no solo prefijo) usen indice en vez de
--   escanear toda la tabla.
-- - `search_profiles` ahora rankea resultados estilo "busqueda de personas"
--   (coincidencia exacta de username primero, despues prefijo de username,
--   despues prefijo de nombre, despues resto) en vez de orden alfabetico
--   plano, para que los resultados mas relevantes aparezcan primero.

create extension if not exists pg_trgm;

create index if not exists idx_profiles_full_name_trgm
  on public.profiles using gin (full_name gin_trgm_ops);

create index if not exists idx_profiles_username_trgm
  on public.profiles using gin (username gin_trgm_ops);

drop function if exists public.search_profiles(text);

create or replace function public.search_profiles(search_query text)
returns table (user_id uuid, full_name text, avatar_url text, username text, public_id text)
language sql
security definer
set search_path = public
as $$
  select p.user_id, p.full_name, p.avatar_url, p.username, p.public_id
  from public.profiles p
  where p.user_id <> auth.uid()
    and (
      p.full_name ilike '%' || search_query || '%'
      or p.username ilike '%' || search_query || '%'
      or p.public_id ilike search_query || '%'
    )
  order by
    case
      when lower(p.username) = lower(search_query) then 0
      when p.username ilike search_query || '%' then 1
      when p.full_name ilike search_query || '%' then 2
      else 3
    end,
    p.full_name
  limit 20;
$$;

revoke all on function public.search_profiles(text) from public;
grant execute on function public.search_profiles(text) to authenticated;
