-- gym//TRK · v352 · cuentas y datos en la nube (Supabase) · + SOCIAL (2026-10-15): seguir y resumen del día
-- ============================================================================================================
-- QUÉ ES: una copia de la base de cada persona, guardada con candado: cada quien solo puede leer y escribir la suya.
--         Además (SOCIAL), un RESUMEN DEL DÍA que cada quien decide compartir con quien lo siga, y nada más.
-- CÓMO SE USA: Supabase → SQL Editor → New query → pegar TODO este archivo → Run. Se puede correr las veces que
--              haga falta: no duplica nada ni borra datos de nadie (es idempotente). Lo único que recorta al
--              correrlo es lo que la app ya recorta sola (el historial de copias a sus 7 días más recientes) y
--              versiones viejas de estas mismas funciones (ver 0).
-- QUÉ CREA:
--   · user_state        una fila por persona con su base (comprimida) y un número de versión (`rev`)
--   · user_state_hist   la versión anterior de cada día, hasta 7 días (red de seguridad si una copia mala pisa a una buena)
--   · state_push(...)   guarda una copia nueva SOLO si nadie más guardó antes (si no, avisa "conflicto")
--   · state_pull(...)   devuelve la copia de quien pregunta
--   · delete_my_account()  borra a la persona y, con ella, TODAS sus filas (también las de SOCIAL)
--   Esas dos tablas tampoco se tocan directo: SOLO por state_push / state_pull (así nadie se brinca sus topes).
--   SOCIAL — perfiles públicos con cuatro interruptores, todos APAGADOS hasta que la persona los prenda:
--   · profiles          una fila por persona: su @usuario, su nombre visible y los 4 interruptores
--                       (entreno · σ · kcal y macros · sueño)
--   · follows           a quién sigue cada persona (sin aprobación; nadie más puede ver esa lista)
--   · follow_quota      cuántas personas nuevas siguió cada quien hoy (freno contra robots)
--   · day_summary       el resumen de cada día, últimos 30 días: solo números, nunca alimentos ni alcohol
--   · profile_get · profile_set · profile_delete · profile_search · follow · unfollow · following · summary_push ·
--     social_feed       todo lo social pasa por estas funciones: sus tablas NO se leen ni escriben directo
--   · al final del archivo, el CONTRATO de cada función (qué recibe, qué devuelve, qué errores da)
-- NADA de aquí usa la llave secreta: la app habla con la llave pública (sb_publishable_…) y la sesión de cada persona.
-- ============================================================================================================

-- 0) Limpieza de versiones viejas de las funciones -------------------------------------------------------------
-- Si alguna función de este archivo existiera con OTRA lista de parámetros (un borrador viejo, o un cambio futuro),
-- `create or replace` no la reemplazaría: crearía una segunda y la vieja seguiría viva, con sus reglas viejas y
-- sus permisos (y la API podría confundirse entre las dos). Aquí se borra toda versión que no sea exactamente la de
-- este archivo; las vigentes no se tocan.
-- OJO al cambiar los parámetros de una función: actualizar también su línea en esta lista y en los permisos (8 y S10).
-- Para solo RENOMBRAR un parámetro (mismos tipos), poner antes de su create: drop function if exists public.<f>(<tipos>);
do $$
declare
  r record;
begin
  for r in
    select pg_catalog.format('public.%I(%s)', p.proname, pg_catalog.oidvectortypes(p.proargtypes)) as fn
      from pg_catalog.pg_proc p
     where p.pronamespace = 'public'::regnamespace
       and p.prokind = 'f'
       and p.proname in ('state_push', 'state_pull', 'delete_my_account',
                         'social_cut', 'social_text', 'social_card', 'profile_get', 'profile_set', 'profile_delete',
                         'profile_search', 'follow', 'unfollow', 'following', 'summary_push', 'social_feed')
       and p.proname || '(' || pg_catalog.oidvectortypes(p.proargtypes) || ')' not in (
             'state_push(integer, bigint, text, text, integer, text)',
             'state_pull(integer)',
             'delete_my_account()',
             'social_cut()',
             'social_text(text, integer)',
             'social_card(uuid)',
             'profile_get()',
             'profile_set(text, text, boolean, boolean, boolean, boolean)',
             'profile_delete()',
             'profile_search(text)',
             'follow(text)',
             'unfollow(text)',
             'following()',
             'summary_push(date, boolean, text, numeric, date, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, boolean)',
             'social_feed()')
  loop
    execute 'drop function ' || r.fn;
  end loop;
end;
$$;

-- 1) La copia vigente de cada persona -----------------------------------------------------------------------
create table if not exists public.user_state (
  user_id    uuid primary key references auth.users (id) on delete cascade,  -- al borrar la cuenta, se va su fila
  rev        integer     not null default 0,     -- versión en la nube: sube de 1 en 1 con cada copia aceptada
  seq        bigint      not null default 0,     -- sello de recencia del teléfono que la subió (solo informativo)
  data       text        not null default '',    -- la base: JSON comprimido (gzip → base64) o JSON plano
  enc        text        not null default 'gz64',-- cómo viene `data`: 'gz64' (comprimido) o 'json' (plano)
  size       integer     not null default 0,     -- tamaño del JSON sin comprimir, en caracteres
  device     text        not null default '',    -- de qué dispositivo salió (etiqueta corta, sin datos personales)
  updated_at timestamptz not null default now()
);

-- 2) Historial: la versión que había antes de cada cambio, una por día, 7 días ---------------------------------
create table if not exists public.user_state_hist (
  user_id  uuid        not null references auth.users (id) on delete cascade,
  day      date        not null,                 -- día (UTC) en que esa versión estuvo vigente
  rev      integer     not null,
  seq      bigint      not null default 0,
  data     text        not null,
  enc      text        not null default 'gz64',
  size     integer     not null default 0,
  device   text        not null default '',
  saved_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- 3) El candado (RLS): cada fila solo la ve su dueño -----------------------------------------------------------
-- Es la segunda cerradura: la app ni siquiera tiene permiso sobre estas tablas (ver 4). Si algún día alguien lo
-- devolviera por error, cada quien solo podría LEER lo suyo y nadie podría escribir directo.
alter table public.user_state      enable row level security;
alter table public.user_state_hist enable row level security;

drop policy if exists user_state_own on public.user_state;
create policy user_state_own on public.user_state
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists user_state_hist_own on public.user_state_hist;
create policy user_state_hist_own on public.user_state_hist
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- 4) Permisos: la app NO toca estas dos tablas directo (ni quien no ha entrado, ni quien ya entró). Todo pasa por
--    state_push / state_pull, que son las que ponen los topes (4 MB por copia, 7 días de historial, control de
--    versión). Si la tabla quedara abierta, cualquiera con cuenta podría saltárselos por /rest/v1/user_state_hist
--    y llenar la base de todos (en el plan gratis, al pasar de 500 MB el proyecto entero queda en solo lectura).
revoke all on public.user_state      from anon, authenticated, public;
revoke all on public.user_state_hist from anon, authenticated, public;

-- Respaldo en la tabla misma: el tope de 4 MB y las etiquetas válidas. `not valid` = no revisa filas viejas, así
-- que correr el archivo otra vez nunca falla. Si cambia max_len en state_push, cambiarlo aquí también.
alter table public.user_state drop constraint if exists user_state_size_ok;
alter table public.user_state add  constraint user_state_size_ok
  check (length(data) <= 4000000 and enc in ('gz64', 'json') and char_length(device) <= 80) not valid;
alter table public.user_state_hist drop constraint if exists user_state_hist_size_ok;
alter table public.user_state_hist add  constraint user_state_hist_size_ok
  check (length(data) <= 4000000 and enc in ('gz64', 'json') and char_length(device) <= 80) not valid;

-- Si mientras las tablas estuvieron abiertas alguien metió historial de más, se recorta a los 7 días más recientes
-- de cada persona: es lo mismo que state_push hace en cada guardado, así que a quien usa la app no le quita nada.
delete from public.user_state_hist h
 where h.day not in (select h2.day from public.user_state_hist h2
                      where h2.user_id = h.user_id order by h2.day desc limit 7);

-- 5) Guardar una copia -----------------------------------------------------------------------------------------
-- La app manda la versión que ella cree vigente (`expected_rev`; 0 si nunca hubo copia). Si en la nube hay otra,
-- NO se escribe nada y se devuelve {ok:false, conflict:true, rev:<la vigente>}: la app baja esa, une lo que falte
-- y vuelve a intentar. Así dos teléfonos nunca se pisan a ciegas.
-- Corre con permisos elevados (security definer) porque la app ya no tiene permiso sobre la tabla. Cada sentencia
-- filtra por auth.uid() (QUIEN LLAMA), así que solo puede tocar la fila de esa persona; el search_path va fijo.
create or replace function public.state_push(
  expected_rev integer,
  seq          bigint,
  data         text,
  enc          text,
  size         integer,
  device       text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid     uuid := (select auth.uid());
  cur     public.user_state%rowtype;
  new_rev integer;
  max_len constant integer := 4000000;   -- tope de caracteres de `data` (igual que CLOUD_MAX en la app y que la regla de 4)
begin
  if uid is null then
    raise exception 'sin sesion' using errcode = '28000';
  end if;
  if data is null or length(data) = 0 then
    return jsonb_build_object('ok', false, 'error', 'empty');          -- una copia vacía jamás reemplaza a una con datos
  end if;
  if length(data) > max_len then
    return jsonb_build_object('ok', false, 'error', 'too_big', 'max', max_len);
  end if;
  if enc is null or enc not in ('gz64', 'json') then
    return jsonb_build_object('ok', false, 'error', 'bad_enc');
  end if;

  select * into cur from public.user_state s where s.user_id = uid for update;

  if not found then
    if coalesce(expected_rev, 0) <> 0 then
      return jsonb_build_object('ok', false, 'conflict', true, 'rev', 0);
    end if;
    begin
      insert into public.user_state (user_id, rev, seq, data, enc, size, device, updated_at)
      values (uid, 1, coalesce(seq, 0), data, enc, coalesce(size, 0), left(coalesce(device, ''), 80), now());
    exception when unique_violation then
      -- otro dispositivo creó la fila en el mismo instante: que la app la lea y decida
      select s.rev into new_rev from public.user_state s where s.user_id = uid;
      return jsonb_build_object('ok', false, 'conflict', true, 'rev', coalesce(new_rev, 0));
    end;
    return jsonb_build_object('ok', true, 'rev', 1);
  end if;

  if cur.rev <> coalesce(expected_rev, 0) then
    return jsonb_build_object('ok', false, 'conflict', true, 'rev', cur.rev);
  end if;

  -- la versión que se va a reemplazar queda en el historial, en el día en que estuvo vigente
  if length(cur.data) > 0 then
    insert into public.user_state_hist (user_id, day, rev, seq, data, enc, size, device, saved_at)
    values (uid, (cur.updated_at at time zone 'utc')::date, cur.rev, cur.seq, cur.data, cur.enc, cur.size, cur.device, now())
    on conflict (user_id, day) do update
      set rev = excluded.rev, seq = excluded.seq, data = excluded.data, enc = excluded.enc,
          size = excluded.size, device = excluded.device, saved_at = excluded.saved_at;
    -- se quedan los 7 días más recientes (por día guardado, no por calendario: un mes sin abrir la app no los borra)
    delete from public.user_state_hist h
     where h.user_id = uid
       and h.day not in (select h2.day from public.user_state_hist h2 where h2.user_id = uid order by h2.day desc limit 7);
  end if;

  new_rev := cur.rev + 1;
  update public.user_state s
     set rev = new_rev, seq = coalesce(state_push.seq, 0), data = state_push.data, enc = state_push.enc,
         size = coalesce(state_push.size, 0), device = left(coalesce(state_push.device, ''), 80), updated_at = now()
   where s.user_id = uid;
  return jsonb_build_object('ok', true, 'rev', new_rev);
end;
$$;

-- 6) Leer la copia ---------------------------------------------------------------------------------------------
-- `have_rev` = la versión que el teléfono ya tiene. Si es la misma, se devuelve todo MENOS `data` (ahorra bajar
-- ~250 KB cada vez que se abre la app). Sin fila: {found:false}.
-- Igual que state_push: permisos elevados (security definer), pero solo lee la fila de QUIEN LLAMA.
create or replace function public.state_pull(have_rev integer default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  cur public.user_state%rowtype;
begin
  if uid is null then
    raise exception 'sin sesion' using errcode = '28000';
  end if;
  select * into cur from public.user_state s where s.user_id = uid;
  if not found then
    return jsonb_build_object('found', false, 'rev', 0);
  end if;
  return jsonb_build_object(
    'found', true, 'rev', cur.rev, 'seq', cur.seq, 'enc', cur.enc, 'size', cur.size,
    'device', cur.device, 'updated_at', cur.updated_at,
    'data', case when have_rev is not null and have_rev = cur.rev then null else cur.data end);
end;
$$;

-- 7) Borrar mi cuenta ------------------------------------------------------------------------------------------
-- Borra a la persona de la lista de usuarios; sus filas de TODAS las tablas (también las de SOCIAL) se van solas
-- (on delete cascade). Corre con permisos elevados (security definer) porque un usuario normal no puede tocar
-- auth.users. Solo borra a QUIEN LLAMA (auth.uid()) y lleva el search_path fijo para que nadie le cambie el camino.
create or replace function public.delete_my_account()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then
    raise exception 'sin sesion' using errcode = '28000';
  end if;
  delete from auth.users u where u.id = uid;
  return jsonb_build_object('ok', true);
end;
$$;

-- 8) Quién puede llamar a las funciones: solo quien ya entró a su cuenta ---------------------------------------
revoke all on function public.state_push(integer, bigint, text, text, integer, text) from public, anon;
revoke all on function public.state_pull(integer)                                   from public, anon;
revoke all on function public.delete_my_account()                                   from public, anon;
grant execute on function public.state_push(integer, bigint, text, text, integer, text) to authenticated;
grant execute on function public.state_pull(integer)                                   to authenticated;
grant execute on function public.delete_my_account()                                   to authenticated;

-- ============================================================================================================
-- SOCIAL (2026-10-15): seguir a otras personas y ver su RESUMEN DEL DÍA
-- ============================================================================================================
-- La idea en corto:
--   · Cada persona tiene un perfil público (@usuario + nombre) y CUATRO interruptores, todos APAGADOS al empezar:
--       entreno       → si entrenó, qué día de su split le tocaba y su racha
--       σ             → la σ (tensión mecánica) de su última sesión registrada y de qué día es
--       kcal y macros → kcal contra su meta, proteína / carbos / grasa y si fue día de mamarre (fiesta o viaje)
--       sueño         → minutos dormidos y puntaje
--   · Seguir a alguien no pide permiso y solo da acceso a eso: su último resumen, con lo que tenga prendido HOY.
--   · Nunca viajan alimentos, alcohol, peso ni la base completa: la tabla del resumen ni siquiera tiene dónde guardarlos.
--   · NO es en tiempo real: lo que ven los demás se publica por CORTES fijos cada 6 horas (00, 06, 12 y 18 UTC).
--     Entre un corte y el siguiente, los demás siguen viendo tu resumen como estaba en el último corte. Así nadie
--     puede deducir a qué hora entrenaste, comiste o despertaste consultando seguido. La hora nunca se publica.
--   · Ojo con σ: compartirla deja ver de qué día es tu última sesión (y cuándo cambia), aunque "entreno" esté
--     apagado. No se puede evitar sin dejar de compartir σ: la app debe decirlo en el texto de ese interruptor.
--   · Para salir de SOCIAL sin borrar la cuenta: profile_delete() borra tu perfil, tus resúmenes, a quién sigues y
--     quién te sigue. Tu base de entrenamiento no se toca.
-- Los candados:
--   1) Las tablas sociales NO se pueden leer ni escribir directo desde la app (/rest/v1/profiles, etc. → negado).
--   2) Todo pasa por funciones con permisos elevados (security definer) que solo actúan sobre QUIEN LLAMA
--      (auth.uid()): nadie puede escribir un resumen, seguir ni dejar de seguir en nombre de otro.
--   3) Lo de otra persona se arma en el servidor con SUS interruptores de ese momento: lo apagado sale vacío (null)
--      aunque estuviera prendido cuando se guardó. Además, apagar un interruptor BORRA esa parte de los resúmenes
--      guardados, y apagar los cuatro borra los resúmenes completos (ni siquiera queda cuándo registró).
--   4) El texto que escribe una persona (@usuario, nombre visible, día del split) es texto AJENO para quien lo lee:
--      la base quita < >, controles e invisibles, pero comillas, ' y & sí pasan (son legítimos: «Push & Pull»,
--      «D'Angelo»). Por eso la app lo pinta SIEMPRE como texto (textContent o escTxt), nunca con innerHTML crudo.

-- S0) Seguro: si el proyecto ya tuviera OTRA tabla con el nombre de alguna de las sociales (algunas plantillas de
--     Supabase crean public.profiles con otras columnas), se detiene todo con un aviso claro en vez de mezclarla.
--     Se reconoce cada tabla nuestra por una columna que solo ella tiene. No borra ni cambia nada.
do $$
declare
  r record;
begin
  for r in
    select v.tbl, v.col
      from (values ('profiles', 'share_sleep'), ('follows', 'followee'),
                   ('follow_quota', 'n'), ('day_summary', 'sleep_score')) as v (tbl, col)
  loop
    if exists (select 1 from information_schema.tables t
                where t.table_schema = 'public' and t.table_name = r.tbl)
       and not exists (select 1 from information_schema.columns c
                        where c.table_schema = 'public' and c.table_name = r.tbl and c.column_name = r.col) then
      raise exception 'Ya existe una tabla public.% que no es la de gym//TRK SOCIAL. No se cambió nada: revisarla antes de seguir.', r.tbl;
    end if;
  end loop;
end;
$$;

-- S1) Perfiles: una fila por persona ----------------------------------------------------------------------------
create table if not exists public.profiles (
  user_id      uuid        primary key references auth.users (id) on delete cascade,  -- al borrar la cuenta, se va
  username     text        not null,                -- @usuario: minúsculas, 3 a 20 de a-z, 0-9 y _ (único)
  display_name text,                                -- nombre visible corto (hasta 30); vacío = se muestra el @usuario
  share_train  boolean     not null default false,  -- interruptor "entreno" (incluye la racha)
  share_sigma  boolean     not null default false,  -- interruptor "σ"
  share_food   boolean     not null default false,  -- interruptor "kcal y macros" (incluye el día de mamarre)
  share_sleep  boolean     not null default false,  -- interruptor "sueño"
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create unique index if not exists profiles_username_key    on public.profiles (username);                  -- nadie repite @usuario
create index        if not exists profiles_username_prefix on public.profiles (username text_pattern_ops); -- buscar por el inicio

-- Reglas que la base misma hace cumplir (se quitan y se vuelven a poner: así correr el archivo otra vez no falla)
-- (sin < > ni controles; esto NO vuelve el nombre seguro para HTML: ver candado 4)
alter table public.profiles drop constraint if exists profiles_username_ok;
alter table public.profiles add  constraint profiles_username_ok
  check (username ~ '^[a-z0-9_]{3,20}$');
alter table public.profiles drop constraint if exists profiles_display_name_ok;
alter table public.profiles add  constraint profiles_display_name_ok
  check (display_name is null or (char_length(display_name) between 1 and 30 and display_name !~ '[[:cntrl:]<>]'));

-- S2) A quién sigue cada persona --------------------------------------------------------------------------------
create table if not exists public.follows (
  follower   uuid        not null references auth.users (id) on delete cascade,  -- quien sigue
  followee   uuid        not null references auth.users (id) on delete cascade,  -- a quien sigue
  created_at timestamptz not null default now(),
  primary key (follower, followee)                                               -- no se puede seguir dos veces
);
create index if not exists follows_followee_idx on public.follows (followee);    -- para borrar rápido al cerrar una cuenta

alter table public.follows drop constraint if exists follows_not_self;
alter table public.follows add  constraint follows_not_self check (follower <> followee);  -- nadie se sigue a sí mismo

-- S2b) Freno contra robots: cuántas personas NUEVAS siguió cada quien en el día (UTC). Tope en follow(): 100 al día.
create table if not exists public.follow_quota (
  user_id uuid    primary key references auth.users (id) on delete cascade,  -- al borrar la cuenta, se va
  day     date    not null,                                                  -- día (UTC) del contador
  n       integer not null default 0                                         -- cuántos follow lleva ese día
);

-- S3) El resumen del día: solo números (y el nombre del día del split) ------------------------------------------
-- Una fila por persona y día. Cada envío de la app REEMPLAZA la fila de ese día completa. Se guardan 30 días.
create table if not exists public.day_summary (
  user_id     uuid        not null references auth.users (id) on delete cascade,
  day         date        not null,           -- el día LOCAL de la persona al que corresponde el resumen
  trained     boolean,                        -- entreno: ¿entrenó ese día?
  split_day   text,                           -- entreno: el día de su split que le tocaba ("Push A", "rest"…), hasta 40
  streak      integer,                        -- entreno: su racha
  sigma       numeric(7,2),                   -- σ: la de su última sesión registrada
  sigma_day   date,                           -- σ: de qué día es esa sesión (puede ser anterior a `day`)
  kcal        integer,                        -- kcal y macros: lo comido ese día
  kcal_goal   integer,                        -- kcal y macros: su meta
  protein     integer,                        -- kcal y macros: gramos
  carbs       integer,                        -- kcal y macros: gramos
  fat         integer,                        -- kcal y macros: gramos
  mamarre     boolean,                        -- kcal y macros: ¿fue día de mamarre (fiesta o viaje)?
  sleep_min   integer,                        -- sueño: minutos dormidos
  sleep_score integer,                        -- sueño: puntaje 0 a 100
  updated_at  timestamptz not null default now(),  -- uso interno: NUNCA se muestra a otros
  pub         jsonb,                          -- uso interno: cómo estaba la fila en el último corte (lo que ven los demás)
  pub_cut     timestamptz,                    -- uso interno: de qué corte es esa copia
  primary key (user_id, day)
);
-- columnas que llegaron después: si la tabla ya existía de una corrida anterior, aquí se agregan (sin tocar datos)
alter table public.day_summary add column if not exists pub     jsonb;
alter table public.day_summary add column if not exists pub_cut timestamptz;

-- Rangos sensatos (vacío siempre se permite: significa "no lo sé" o "no lo comparto")
alter table public.day_summary drop constraint if exists day_summary_split_ok;
alter table public.day_summary add  constraint day_summary_split_ok
  check (split_day is null or (char_length(split_day) between 1 and 40 and split_day !~ '[[:cntrl:]<>]'));
alter table public.day_summary drop constraint if exists day_summary_streak_ok;
alter table public.day_summary add  constraint day_summary_streak_ok
  check (streak is null or streak between 0 and 10000);
alter table public.day_summary drop constraint if exists day_summary_sigma_ok;      -- σ y su día van juntos o no van
alter table public.day_summary add  constraint day_summary_sigma_ok
  check ((sigma is null and sigma_day is null)
      or (sigma is not null and sigma_day is not null
          and sigma between 0 and 1000 and sigma_day between day - 3650 and day));
alter table public.day_summary drop constraint if exists day_summary_food_ok;
alter table public.day_summary add  constraint day_summary_food_ok
  check (    (kcal      is null or kcal      between 0 and 20000)
         and (kcal_goal is null or kcal_goal between 0 and 20000)
         and (protein   is null or protein   between 0 and 2000)
         and (carbs     is null or carbs     between 0 and 2000)
         and (fat       is null or fat       between 0 and 2000));
alter table public.day_summary drop constraint if exists day_summary_sleep_ok;
alter table public.day_summary add  constraint day_summary_sleep_ok
  check (    (sleep_min   is null or sleep_min   between 0 and 1440)
         and (sleep_score is null or sleep_score between 0 and 100));

-- S4) Candados de las tablas sociales ---------------------------------------------------------------------------
-- La app NO tiene permiso de tocarlas directo (ni leer ni escribir): todo pasa por las funciones de abajo.
-- El candado por fila (RLS) queda prendido como segunda cerradura: si algún día alguien devolviera permisos por
-- error, cada quien seguiría viendo solo lo suyo (y nunca a quién sigue otra persona), y nadie podría escribir.
-- follow_quota no tiene ninguna regla de lectura: ni siquiera su dueño la ve.
alter table public.profiles     enable row level security;
alter table public.follows      enable row level security;
alter table public.follow_quota enable row level security;
alter table public.day_summary  enable row level security;

drop policy if exists profiles_own_read on public.profiles;
create policy profiles_own_read on public.profiles
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists follows_own_read on public.follows;
create policy follows_own_read on public.follows
  for select to authenticated
  using ((select auth.uid()) = follower);

drop policy if exists day_summary_own_read on public.day_summary;
create policy day_summary_own_read on public.day_summary
  for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.profiles     from anon, authenticated, public;
revoke all on public.follows      from anon, authenticated, public;
revoke all on public.follow_quota from anon, authenticated, public;
revoke all on public.day_summary  from anon, authenticated, public;

-- S5a) El CORTE: lo que ven los demás se publica por bloques fijos de 6 horas (00, 06, 12 y 18 UTC). Esta función
--      dice dónde empezó el bloque actual. Para cambiar la ventana (p. ej. a 3 horas) se cambia SOLO aquí (y el
--      CONTRATO). Uso interno: la app no puede llamarla.
create or replace function public.social_cut()
returns timestamptz
language sql
stable
security invoker
set search_path = ''
as $$
  select pg_catalog.date_bin(interval '6 hours', pg_catalog.now(), timestamptz '2000-01-01 00:00:00+00');
$$;

-- S5b) Limpieza del texto que escribe una persona y leen otras (nombre visible y día del split), en este orden:
--   1) saltos de línea, tabs y espacios raros → un espacio
--   2) se quitan < >, caracteres de control e invisibles (se CONSERVA el unidor U+200D, que arma emoji como 🏋️‍♂️)
--   3) otra vez sin espacios dobles (por si un invisible separaba dos espacios)
--   4) sin espacios en las orillas y cortado a p_max caracteres
--   Si no queda nada visible (solo espacios, unidores o selectores de variante), devuelve null.
--   OJO: esto NO vuelve el texto seguro para HTML (comillas, ' y & pasan): ver candado 4.
--   Uso interno: la app no puede llamarla.
create or replace function public.social_text(p_text text, p_max integer)
returns text
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  v text;
begin
  if p_text is null then
    return null;
  end if;
  v := regexp_replace(left(p_text, 200), '[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]+', ' ', 'g');
  v := regexp_replace(v, '[[:cntrl:]<>\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180E\u200B\u200C\u200E\u200F\u202A-\u202E\u2060-\u206F\u2800\u3164\uFEFF\uFFA0\uFFF9-\uFFFB]', '', 'g');
  v := regexp_replace(v, ' {2,}', ' ', 'g');
  v := btrim(left(btrim(v), p_max));
  if regexp_replace(v, '[ \u200D\uFE00-\uFE0F]', '', 'g') = '' then
    return null;
  end if;
  return v;
end;
$$;

-- S5) La tarjeta de una persona, tal como la ven los demás (uso interno; la app no puede llamarla) -------------
-- Devuelve {shares:{train,sigma,food,sleep}, summary:{…}|null} aplicando los interruptores de AHORA del dueño:
--   · Cada día se ve en su versión VISIBLE (ver S5a): si la fila no cambió desde el último corte, la de ahora; si
--     cambió después del corte, la copia que se congeló en el corte (`pub`); si se creó después del corte, todavía
--     nada. Así lo nuevo aparece hasta el siguiente corte y nadie puede ubicar la hora de un registro.
--   · `summary` es su día más reciente (de hoy−30 a hoy+1, en UTC) que tenga algo de lo que comparte; lo apagado va null.
--   · Con los cuatro apagados, o sin nada que mostrar, `summary` es null: tampoco se sabe cuándo registró.
--   · La hora de registro (updated_at) nunca sale.
-- Corre con los permisos de quien la llama (security invoker) y la app no tiene permiso de llamarla: solo la usan
-- las funciones de abajo.
create or replace function public.social_card(p_owner uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
           'shares', jsonb_build_object('train', p.share_train, 'sigma', p.share_sigma,
                                        'food',  p.share_food,  'sleep', p.share_sleep),
           'summary', case when d.day is null then null else jsonb_build_object(
               'day',         d.day,
               'trained',     case when p.share_train then d.v -> 'trained'     end,
               'split_day',   case when p.share_train then d.v -> 'split_day'   end,
               'streak',      case when p.share_train then d.v -> 'streak'      end,
               'sigma',       case when p.share_sigma then d.v -> 'sigma'       end,
               'sigma_day',   case when p.share_sigma then d.v -> 'sigma_day'   end,
               'kcal',        case when p.share_food  then d.v -> 'kcal'        end,
               'kcal_goal',   case when p.share_food  then d.v -> 'kcal_goal'   end,
               'protein',     case when p.share_food  then d.v -> 'protein'     end,
               'carbs',       case when p.share_food  then d.v -> 'carbs'       end,
               'fat',         case when p.share_food  then d.v -> 'fat'         end,
               'mamarre',     case when p.share_food  then d.v -> 'mamarre'     end,
               'sleep_min',   case when p.share_sleep then d.v -> 'sleep_min'   end,
               'sleep_score', case when p.share_sleep then d.v -> 'sleep_score' end) end)
    from public.profiles p
   cross join (select public.social_cut() as cut) c
    left join lateral (
      select x.day, x.v
        from (
          -- la versión VISIBLE de cada día: sin cambios desde el corte → la de ahora; cambiada después del corte →
          -- la copia congelada en el corte; creada después del corte → null (todavía no se ve)
          select s.day,
                 case when s.updated_at < c.cut then jsonb_build_object(
                             'trained',   s.trained,   'split_day',   s.split_day,   'streak',  s.streak,
                             'sigma',     s.sigma,     'sigma_day',   s.sigma_day,
                             'kcal',      s.kcal,      'kcal_goal',   s.kcal_goal,   'protein', s.protein,
                             'carbs',     s.carbs,     'fat',         s.fat,         'mamarre', s.mamarre,
                             'sleep_min', s.sleep_min, 'sleep_score', s.sleep_score)
                      when s.pub_cut = c.cut then s.pub
                 end as v
            from public.day_summary s
           where s.user_id = p.user_id
             and s.day >= (now() at time zone 'utc')::date - 30
             and s.day <= (now() at time zone 'utc')::date + 1     -- ninguna zona horaria va más adelante
        ) x
       where x.v is not null
         and (   (p.share_train and coalesce(x.v ->> 'trained', x.v ->> 'split_day', x.v ->> 'streak') is not null)
              or (p.share_sigma and x.v ->> 'sigma' is not null)
              or (p.share_food  and coalesce(x.v ->> 'kcal', x.v ->> 'kcal_goal', x.v ->> 'protein',
                                             x.v ->> 'carbs', x.v ->> 'fat', x.v ->> 'mamarre') is not null)
              or (p.share_sleep and coalesce(x.v ->> 'sleep_min', x.v ->> 'sleep_score') is not null))
       order by x.day desc
       limit 1
    ) d on true
   where p.user_id = p_owner;
$$;

-- S6) Mi perfil: leerlo, guardarlo y borrarlo -------------------------------------------------------------------
-- profile_get(): mi perfil, o null si todavía no tengo. `preview` = mi resumen tal como lo ven quienes me siguen
-- (también con el retraso del corte).
create or replace function public.profile_get()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_out jsonb;
begin
  if v_uid is null then
    raise exception 'sin sesion' using errcode = '28000';
  end if;
  select jsonb_build_object(
           'username',        p.username,
           'display_name',    p.display_name,
           'share_train',     p.share_train,
           'share_sigma',     p.share_sigma,
           'share_food',      p.share_food,
           'share_sleep',     p.share_sleep,
           'following_count', (select count(*) from public.follows f where f.follower = v_uid),
           'preview',         public.social_card(v_uid) -> 'summary',
           'created_at',      p.created_at,
           'updated_at',      p.updated_at)
    into v_out
    from public.profiles p
   where p.user_id = v_uid;
  return v_out;                                    -- null si aún no tiene perfil
end;
$$;

-- profile_set(...): crea o cambia MI perfil. Lo que llegue vacío (null) se queda como estaba; al crear, los cuatro
-- interruptores arrancan apagados. Devuelve {ok:true, profile:{…}} o {ok:false, error:'bad_username'|'reserved'|'taken'}.
-- Apagar un interruptor borra esa parte de mis resúmenes guardados; apagar los cuatro los borra completos.
create or replace function public.profile_set(
  p_username     text    default null,
  p_display_name text    default null,
  p_share_train  boolean default null,
  p_share_sigma  boolean default null,
  p_share_food   boolean default null,
  p_share_sleep  boolean default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid      uuid := (select auth.uid());
  v_cur      public.profiles%rowtype;
  v_exists   boolean;
  v_user     text;
  v_core     text;
  v_name     text;
  v_train    boolean;
  v_sig      boolean;
  v_food     boolean;
  v_sleep    boolean;
  -- @usuarios que nadie puede tomar (también con _ o números en las orillas, o con números en vez de letras)
  v_reserved constant text[] := array[
    'admin', 'administrador', 'administrator', 'root', 'null', 'undefined', 'system', 'sistema',
    'gymtrk', 'gym_trk', 'trk', 'soporte', 'support', 'ayuda', 'help', 'staff', 'equipo', 'team',
    'moderador', 'moderator', 'mod', 'oficial', 'official', 'api', 'www', 'anon', 'anonimo', 'anonymous'];
  -- lo que no puede aparecer EN NINGUNA PARTE del @usuario ni del nombre visible: la marca y "soporte/oficial"
  v_brand    constant text := '(gymtrk|gimtrk|gymtrak|gimtrak|gymtrck|soporte|support|oficial|official|moderador|moderator|administra)';
  -- letras cirílicas y griegas que se ven igual que las latinas (para que «gymтrk» o «Ѕoporte» no se cuelen)
  v_look     constant text := 'авекмнорстухіјѕԁүӏɡαβεικνορτυχγАВЕКМНОРСТУХІЈЅҮӀΑΒΕΙΚΝΟΡΤΥΧΖΗΜ';
  v_latin    constant text := 'abekmhopctyxijsdylgabeikvoptuxyabekmhopctyxijsylabeiknoptyxzhm';
begin
  if v_uid is null then
    raise exception 'sin sesion' using errcode = '28000';
  end if;

  select * into v_cur from public.profiles p where p.user_id = v_uid for update;
  v_exists := found;

  -- @usuario: se pasa a minúsculas y se le quita el '@' del inicio; debe quedar en 3 a 20 de a-z, 0-9 y _
  if p_username is null then
    if not v_exists then
      return jsonb_build_object('ok', false, 'error', 'bad_username');   -- al crear, el @usuario es obligatorio
    end if;
    v_user := v_cur.username;
  else
    v_user := lower(ltrim(btrim(left(p_username, 64)), '@'));
    if v_user !~ '^[a-z0-9_]{3,20}$' then
      return jsonb_build_object('ok', false, 'error', 'bad_username');
    end if;
    -- reservado (solo si CAMBIA: lo que ya tenías se respeta). Se lee "limpio": sin _ ni números en las orillas
    -- y con 0→o 1→i 3→e 4→a 5→s 6→g 7→t 8→b 9→g ("admin_", "adm1n" y "_root_99" cuentan como reservados)
    if v_user is distinct from v_cur.username then
      v_core := translate(replace(regexp_replace(v_user, '^[_0-9]+|[_0-9]+$', '', 'g'), '_', ''),
                          '013456789', 'oieasgtbg');
      if v_user = any (v_reserved) or v_core = any (v_reserved)
         or translate(replace(v_user, '_', ''), '013456789', 'oieasgtbg') ~ v_brand then
        return jsonb_build_object('ok', false, 'error', 'reserved');
      end if;
    end if;
    if exists (select 1 from public.profiles p where p.username = v_user and p.user_id <> v_uid) then
      return jsonb_build_object('ok', false, 'error', 'taken');
    end if;
  end if;

  -- nombre visible: se limpia (ver S5b) y se corta a 30; "" o algo sin nada visible lo borra
  if p_display_name is null then
    v_name := v_cur.display_name;
  else
    v_name := public.social_text(p_display_name, 30);
  end if;
  -- el nombre visible tampoco puede hacerse pasar por la marca o por soporte ("gym//TRK Soporte", "Ѕoporte"…).
  -- Se lee en forma simple (NFKC), en minúsculas, con las letras cirílicas/griegas parecidas cambiadas, sin nada
  -- que no sea letra o número, y con los números leídos como letras. Solo se revisa si el nombre CAMBIA.
  if v_name is not null and v_name is distinct from v_cur.display_name
     and translate(regexp_replace(translate(lower(normalize(v_name, NFKC)), v_look, v_latin), '[^a-z0-9]', '', 'g'),
                   '013456789', 'oieasgtbg') ~ v_brand then
    return jsonb_build_object('ok', false, 'error', 'reserved');
  end if;

  -- interruptores: lo que no se manda se queda; si el perfil es nuevo, apagado
  v_train := coalesce(p_share_train, v_cur.share_train, false);
  v_sig   := coalesce(p_share_sigma, v_cur.share_sigma, false);
  v_food  := coalesce(p_share_food,  v_cur.share_food,  false);
  v_sleep := coalesce(p_share_sleep, v_cur.share_sleep, false);

  begin
    insert into public.profiles (user_id, username, display_name, share_train, share_sigma, share_food, share_sleep)
    values (v_uid, v_user, v_name, v_train, v_sig, v_food, v_sleep)
    on conflict (user_id) do update
       set username     = excluded.username,
           display_name = excluded.display_name,
           share_train  = excluded.share_train,
           share_sigma  = excluded.share_sigma,
           share_food   = excluded.share_food,
           share_sleep  = excluded.share_sleep,
           updated_at   = now();
  exception when unique_violation then
    -- otra persona tomó ese @usuario en el mismo instante
    return jsonb_build_object('ok', false, 'error', 'taken');
  end;

  -- lo apagado se borra también de los resúmenes guardados (el servidor solo guarda lo que compartes),
  -- incluida la copia congelada del corte (`pub`)
  if not (v_train or v_sig or v_food or v_sleep) then
    delete from public.day_summary d where d.user_id = v_uid;
  elsif not (v_train and v_sig and v_food and v_sleep) then
    update public.day_summary d
       set trained     = case when v_train then d.trained     end,
           split_day   = case when v_train then d.split_day   end,
           streak      = case when v_train then d.streak      end,
           sigma       = case when v_sig   then d.sigma       end,
           sigma_day   = case when v_sig   then d.sigma_day   end,
           kcal        = case when v_food  then d.kcal        end,
           kcal_goal   = case when v_food  then d.kcal_goal   end,
           protein     = case when v_food  then d.protein     end,
           carbs       = case when v_food  then d.carbs       end,
           fat         = case when v_food  then d.fat         end,
           mamarre     = case when v_food  then d.mamarre     end,
           sleep_min   = case when v_sleep then d.sleep_min   end,
           sleep_score = case when v_sleep then d.sleep_score end,
           pub         = d.pub
                         - (case when v_train then '{}'::text[] else '{trained,split_day,streak}'::text[] end)
                         - (case when v_sig   then '{}'::text[] else '{sigma,sigma_day}'::text[] end)
                         - (case when v_food  then '{}'::text[] else '{kcal,kcal_goal,protein,carbs,fat,mamarre}'::text[] end)
                         - (case when v_sleep then '{}'::text[] else '{sleep_min,sleep_score}'::text[] end)
     where d.user_id = v_uid;
  end if;
  delete from public.day_summary d
   where d.user_id = v_uid and d.day < (now() at time zone 'utc')::date - 30;

  return jsonb_build_object('ok', true, 'profile', public.profile_get());
end;
$$;

-- profile_delete(): salgo de SOCIAL sin borrar mi cuenta ni mi base. Borra mi perfil (ya no salgo en búsquedas),
-- mis resúmenes, a quién sigo y quién me sigue. Si no tenía perfil, también {ok:true}.
-- El orden importa: PRIMERO el perfil (si alguien me está siguiendo en este mismo instante, esto espera a que
-- termine; ver follow) y DESPUÉS los seguimientos, para que no quede ninguno suelto que reviva si vuelvo a crear perfil.
create or replace function public.profile_delete()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'sin sesion' using errcode = '28000';
  end if;
  delete from public.profiles    p where p.user_id = v_uid;
  delete from public.follows     f where f.follower = v_uid or f.followee = v_uid;
  delete from public.day_summary d where d.user_id = v_uid;
  return jsonb_build_object('ok', true);
end;
$$;

-- S7) Buscar, seguir y dejar de seguir --------------------------------------------------------------------------
-- profile_search(q): personas cuyo @usuario EMPIEZA con q (mínimo 2 caracteres; máximo 20 resultados; no te incluye).
-- Solo devuelve @usuario, nombre visible y si ya la sigues. Búsqueda corta o inválida → [] (nunca error).
create or replace function public.profile_search(p_q text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_q   text := lower(ltrim(btrim(left(coalesce(p_q, ''), 40)), '@'));
  v_out jsonb;
begin
  if v_uid is null then
    raise exception 'sin sesion' using errcode = '28000';
  end if;
  if v_q !~ '^[a-z0-9_]{2,20}$' then
    return '[]'::jsonb;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('username',     r.username,
                                               'display_name', r.display_name,
                                               'following',    r.i_follow)
                            order by r.exact desc, r.username), '[]'::jsonb)
    into v_out
    from (
      select p.username,
             p.display_name,
             (p.username = v_q) as exact,
             exists (select 1 from public.follows f
                      where f.follower = v_uid and f.followee = p.user_id) as i_follow
        from public.profiles p
       where p.username like (replace(v_q, '_', '\_') || '%')   -- "_" se busca tal cual, no como comodín
         and p.user_id <> v_uid
       order by (p.username = v_q) desc, p.username
       limit 20
    ) r;
  return v_out;
end;
$$;

-- follow(username): empiezo a seguir a esa persona. Sin aprobación. Topes: 300 personas en total y 100 nuevas al día.
-- Devuelve {ok:true} (o {ok:true, already:true}) o {ok:false, error:'not_found'|'self'|'limit'|'rate_limited'}.
create or replace function public.follow(p_username text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := (select auth.uid());
  v_target uuid;
  v_count  integer;
  v_daily  integer;
  v_max    constant integer := 300;          -- tope de personas que alguien puede seguir
  v_rate   constant integer := 100;          -- tope de personas NUEVAS que alguien puede seguir en un día (UTC)
begin
  if v_uid is null then
    raise exception 'sin sesion' using errcode = '28000';
  end if;
  -- se "agarra" el perfil de destino mientras dura esto: si esa persona lo está borrando en este mismo instante
  -- (profile_delete), una de las dos espera a la otra y no queda un seguimiento suelto
  select p.user_id into v_target
    from public.profiles p
   where p.username = lower(ltrim(btrim(left(coalesce(p_username, ''), 64)), '@'))
     for key share;
  if v_target is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  if v_target = v_uid then
    return jsonb_build_object('ok', false, 'error', 'self');
  end if;
  -- candado corto por persona: varios toques al mismo tiempo no logran pasar de los topes
  perform pg_advisory_xact_lock(hashtextextended('gymtrk.follow:' || v_uid::text, 0));
  if exists (select 1 from public.follows f where f.follower = v_uid and f.followee = v_target) then
    return jsonb_build_object('ok', true, 'already', true);
  end if;
  select count(*) into v_count from public.follows f where f.follower = v_uid;
  if v_count >= v_max then
    return jsonb_build_object('ok', false, 'error', 'limit', 'max', v_max);
  end if;
  -- freno contra robots: cuenta cada intento que llega hasta aquí (también los rechazados); el día es UTC
  insert into public.follow_quota as q (user_id, day, n)
  values (v_uid, (now() at time zone 'utc')::date, 1)
  on conflict (user_id) do update
     set n   = case when q.day = excluded.day then q.n + 1 else 1 end,
         day = excluded.day
  returning q.n into v_daily;
  if v_daily > v_rate then
    return jsonb_build_object('ok', false, 'error', 'rate_limited', 'max', v_rate);
  end if;
  insert into public.follows (follower, followee) values (v_uid, v_target)
  on conflict do nothing;
  return jsonb_build_object('ok', true);
end;
$$;

-- unfollow(username): dejo de seguir a esa persona. Si no la seguía, también {ok:true}.
create or replace function public.unfollow(p_username text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := (select auth.uid());
  v_target uuid;
begin
  if v_uid is null then
    raise exception 'sin sesion' using errcode = '28000';
  end if;
  select p.user_id into v_target
    from public.profiles p
   where p.username = lower(ltrim(btrim(left(coalesce(p_username, ''), 64)), '@'));
  if v_target is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  if v_target = v_uid then
    return jsonb_build_object('ok', false, 'error', 'self');
  end if;
  delete from public.follows f where f.follower = v_uid and f.followee = v_target;
  return jsonb_build_object('ok', true);
end;
$$;

-- following(): a quién sigo (en orden alfabético), desde cuándo, y su tarjeta tal como la pueden ver los demás.
-- Solo existe "a quién sigo YO": no hay ninguna función que diga a quién sigue otra persona ni quién me sigue.
create or replace function public.following()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_out jsonb;
begin
  if v_uid is null then
    raise exception 'sin sesion' using errcode = '28000';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('username',     p.username,
                                               'display_name', p.display_name,
                                               'since',        f.created_at)
                            || public.social_card(p.user_id)
                            order by p.username), '[]'::jsonb)
    into v_out
    from public.follows f
    join public.profiles p on p.user_id = f.followee
   where f.follower = v_uid;
  return v_out;
end;
$$;

-- S8) Mandar MI resumen del día ---------------------------------------------------------------------------------
-- La app lo manda al guardar; los demás lo ven a partir del siguiente CORTE (ver S5a), no en tiempo real.
-- Reemplaza mi fila de ese día completa: lo que no mande queda vacío.
--   · `p_day` es mi día LOCAL: se acepta de 3 días atrás a 1 adelante (ninguna zona horaria va más de un día por
--     delante de UTC); fuera de eso, 'bad_day'.
--   · Un valor fuera de rango NO tumba el envío: se ignora (queda vacío) y se avisa en `ignored`.
--   · Los números se redondean (σ a 2 decimales; lo demás a enteros).
--   · Solo se guarda lo que tengo PRENDIDO ahora; sin perfil o con los cuatro apagados no se guarda nada.
--   · De paso se borran mis resúmenes de hace más de 30 días.
create or replace function public.summary_push(
  p_day         date,
  p_trained     boolean default null,
  p_split_day   text    default null,
  p_sigma       numeric default null,
  p_sigma_day   date    default null,
  p_kcal        numeric default null,
  p_kcal_goal   numeric default null,
  p_protein     numeric default null,
  p_carbs       numeric default null,
  p_fat         numeric default null,
  p_sleep_min   numeric default null,
  p_sleep_score numeric default null,
  p_streak      numeric default null,
  p_mamarre     boolean default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := (select auth.uid());
  v_today   date := (now() at time zone 'utc')::date;
  v_cut     timestamptz := public.social_cut();
  v_train   boolean;
  v_sig     boolean;
  v_food    boolean;
  v_sleep   boolean;
  v_ignored text[] := '{}';
  v_trained boolean := p_trained;
  v_split   text;
  v_streak  integer;
  v_sigma   numeric;
  v_sigday  date;
  v_kcal    integer;
  v_goal    integer;
  v_prot    integer;
  v_carbs   integer;
  v_fat     integer;
  v_mam     boolean := p_mamarre;
  v_slmin   integer;
  v_slscore integer;
begin
  if v_uid is null then
    raise exception 'sin sesion' using errcode = '28000';
  end if;
  if p_day is null or p_day < v_today - 3 or p_day > v_today + 1 then
    return jsonb_build_object('ok', false, 'error', 'bad_day');
  end if;

  -- mis interruptores de AHORA (con candado corto: si en este mismo instante apago uno, esto espera y lo respeta)
  select pr.share_train, pr.share_sigma, pr.share_food, pr.share_sleep
    into v_train, v_sig, v_food, v_sleep
    from public.profiles pr
   where pr.user_id = v_uid
     for share;
  if not coalesce(v_train or v_sig or v_food or v_sleep, false) then
    return jsonb_build_object('ok', true, 'stored', false, 'reason', 'not_sharing');
  end if;

  -- entreno: nombre del día del split (texto corto y limpio, ver S5b) y racha
  if p_split_day is not null then
    v_split := public.social_text(p_split_day, 40);
    if v_split is null then
      v_ignored := array_append(v_ignored, 'split_day');
    end if;
  end if;
  if p_streak is not null then
    if p_streak between 0 and 10000 then v_streak := round(p_streak)::integer;
    else v_ignored := array_append(v_ignored, 'streak'); end if;
  end if;

  -- σ: va con su día (que no puede ser posterior al del resumen); si falta uno de los dos, no va ninguno
  if p_sigma is not null or p_sigma_day is not null then
    if p_sigma between 0 and 1000 and p_sigma_day between p_day - 3650 and p_day then
      v_sigma  := round(p_sigma, 2);
      v_sigday := p_sigma_day;
    else
      v_ignored := array_append(v_ignored, 'sigma');
    end if;
  end if;

  -- kcal y macros (gramos)
  if p_kcal is not null then
    if p_kcal between 0 and 20000 then v_kcal := round(p_kcal)::integer;
    else v_ignored := array_append(v_ignored, 'kcal'); end if;
  end if;
  if p_kcal_goal is not null then
    if p_kcal_goal between 0 and 20000 then v_goal := round(p_kcal_goal)::integer;
    else v_ignored := array_append(v_ignored, 'kcal_goal'); end if;
  end if;
  if p_protein is not null then
    if p_protein between 0 and 2000 then v_prot := round(p_protein)::integer;
    else v_ignored := array_append(v_ignored, 'protein'); end if;
  end if;
  if p_carbs is not null then
    if p_carbs between 0 and 2000 then v_carbs := round(p_carbs)::integer;
    else v_ignored := array_append(v_ignored, 'carbs'); end if;
  end if;
  if p_fat is not null then
    if p_fat between 0 and 2000 then v_fat := round(p_fat)::integer;
    else v_ignored := array_append(v_ignored, 'fat'); end if;
  end if;

  -- sueño
  if p_sleep_min is not null then
    if p_sleep_min between 0 and 1440 then v_slmin := round(p_sleep_min)::integer;
    else v_ignored := array_append(v_ignored, 'sleep_min'); end if;
  end if;
  if p_sleep_score is not null then
    if p_sleep_score between 0 and 100 then v_slscore := round(p_sleep_score)::integer;
    else v_ignored := array_append(v_ignored, 'sleep_score'); end if;
  end if;

  -- lo que tengo apagado no se guarda
  if not v_train then v_trained := null; v_split := null; v_streak := null; end if;
  if not v_sig   then v_sigma := null; v_sigday := null; end if;
  if not v_food  then v_kcal := null; v_goal := null; v_prot := null; v_carbs := null; v_fat := null; v_mam := null; end if;
  if not v_sleep then v_slmin := null; v_slscore := null; end if;

  -- antes de cambiar la fila: si es su primer cambio desde el último corte, se congela cómo estaba en el corte.
  -- Eso es lo que siguen viendo los demás hasta el siguiente corte (ver S5a y social_card).
  update public.day_summary d
     set pub     = jsonb_build_object(
                     'trained',   d.trained,   'split_day',   d.split_day,   'streak',  d.streak,
                     'sigma',     d.sigma,     'sigma_day',   d.sigma_day,
                     'kcal',      d.kcal,      'kcal_goal',   d.kcal_goal,   'protein', d.protein,
                     'carbs',     d.carbs,     'fat',         d.fat,         'mamarre', d.mamarre,
                     'sleep_min', d.sleep_min, 'sleep_score', d.sleep_score),
         pub_cut = v_cut
   where d.user_id = v_uid and d.day = p_day and d.updated_at < v_cut;

  insert into public.day_summary (user_id, day, trained, split_day, streak, sigma, sigma_day,
                                  kcal, kcal_goal, protein, carbs, fat, mamarre, sleep_min, sleep_score, updated_at)
  values (v_uid, p_day, v_trained, v_split, v_streak, v_sigma, v_sigday,
          v_kcal, v_goal, v_prot, v_carbs, v_fat, v_mam, v_slmin, v_slscore, now())
  on conflict (user_id, day) do update
     set trained     = excluded.trained,
         split_day   = excluded.split_day,
         streak      = excluded.streak,
         sigma       = excluded.sigma,
         sigma_day   = excluded.sigma_day,
         kcal        = excluded.kcal,
         kcal_goal   = excluded.kcal_goal,
         protein     = excluded.protein,
         carbs       = excluded.carbs,
         fat         = excluded.fat,
         mamarre     = excluded.mamarre,
         sleep_min   = excluded.sleep_min,
         sleep_score = excluded.sleep_score,
         updated_at  = excluded.updated_at;

  -- se quedan solo los últimos 30 días
  delete from public.day_summary d where d.user_id = v_uid and d.day < v_today - 30;

  return jsonb_build_object(
    'ok', true, 'stored', true, 'day', p_day, 'ignored', to_jsonb(v_ignored),
    'shares', jsonb_build_object('train', v_train, 'sigma', v_sig, 'food', v_food, 'sleep', v_sleep));
end;
$$;

-- S9) El feed: el último resumen de cada persona que sigo --------------------------------------------------------
-- Primero quien tiene el resumen más reciente (empate → por @usuario); quien no muestra nada va al final (a-z).
create or replace function public.social_feed()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_out jsonb;
begin
  if v_uid is null then
    raise exception 'sin sesion' using errcode = '28000';
  end if;
  select coalesce(jsonb_agg(c.card
                            order by (c.card #>> '{summary,day}')::date desc nulls last, c.username), '[]'::jsonb)
    into v_out
    from (
      select p.username,
             jsonb_build_object('username', p.username, 'display_name', p.display_name)
               || public.social_card(p.user_id) as card
        from public.follows f
        join public.profiles p on p.user_id = f.followee
       where f.follower = v_uid
    ) c;
  return v_out;
end;
$$;

-- S10) Quién puede llamar a las funciones sociales: solo quien ya entró a su cuenta -------------------------------
-- (social_cut, social_text y social_card son internas: nadie de fuera las puede llamar)
revoke all on function public.social_cut()               from public, anon, authenticated;
revoke all on function public.social_text(text, integer) from public, anon, authenticated;
revoke all on function public.social_card(uuid)          from public, anon, authenticated;
revoke all on function public.profile_get()     from public, anon;
revoke all on function public.profile_set(text, text, boolean, boolean, boolean, boolean) from public, anon;
revoke all on function public.profile_delete()  from public, anon;
revoke all on function public.profile_search(text) from public, anon;
revoke all on function public.follow(text)         from public, anon;
revoke all on function public.unfollow(text)       from public, anon;
revoke all on function public.following()          from public, anon;
revoke all on function public.summary_push(date, boolean, text, numeric, date, numeric, numeric, numeric,
                                           numeric, numeric, numeric, numeric, numeric, boolean) from public, anon;
revoke all on function public.social_feed()        from public, anon;
grant execute on function public.profile_get()     to authenticated;
grant execute on function public.profile_set(text, text, boolean, boolean, boolean, boolean) to authenticated;
grant execute on function public.profile_delete()  to authenticated;
grant execute on function public.profile_search(text) to authenticated;
grant execute on function public.follow(text)         to authenticated;
grant execute on function public.unfollow(text)       to authenticated;
grant execute on function public.following()          to authenticated;
grant execute on function public.summary_push(date, boolean, text, numeric, date, numeric, numeric, numeric,
                                              numeric, numeric, numeric, numeric, numeric, boolean) to authenticated;
grant execute on function public.social_feed()        to authenticated;

-- 9) Que la API vea las funciones nuevas sin esperar
notify pgrst, 'reload schema';

-- Comprobación rápida (opcional, después de Run): las seis tablas deben salir con rls = true …
--   select relname, relrowsecurity as rls from pg_class
--    where relnamespace = 'public'::regnamespace
--      and relname in ('user_state', 'user_state_hist', 'profiles', 'follows', 'follow_quota', 'day_summary');
-- … la app NO debe tener ningún permiso directo sobre ninguna de ellas (esta consulta debe salir VACÍA) …
--   select table_name, grantee, privilege_type from information_schema.role_table_grants
--    where table_schema = 'public'
--      and table_name in ('user_state', 'user_state_hist', 'profiles', 'follows', 'follow_quota', 'day_summary')
--      and grantee in ('anon', 'authenticated', 'PUBLIC');
-- … y cada función debe existir UNA sola vez (esta consulta también debe salir VACÍA):
--   select proname, count(*) from pg_proc where pronamespace = 'public'::regnamespace group by 1 having count(*) > 1;

-- ============================================================================================================
-- CONTRATO SOCIAL — lo que la app (y un servidor falso en memoria, para pruebas) deben imitar al pie de la letra
-- ============================================================================================================
-- CÓMO SE LLAMA: POST {SUPABASE_URL}/rest/v1/rpc/<función>
--   headers: apikey: <llave publicable> · Authorization: Bearer <access_token> · Content-Type: application/json
--   body: un objeto JSON con los parámetros POR NOMBRE, con su prefijo p_ ({} si no lleva). Los marcados "= null"
--         se pueden omitir. OJO: una llave que la función no tiene (p. ej. "p_alcohol") hace que PostgREST no la
--         encuentre → HTTP 404, code PGRST202. Nunca se manda user_id: el servidor usa siempre al que llama.
-- ERRORES QUE NO VIENEN COMO {ok:false} (son error HTTP, igual en todas):
--   · sin token, token vencido o solo la llave pública → 401 (anon no puede ejecutar ninguna función social)
--   · token válido pero sin usuario (auth.uid() vacío) → 403, code '28000', message 'sin sesion'
--   · un valor de otro tipo (fecha mal escrita, texto donde va número o true/false) → 400 (22P02 / 22007 / 22008)
--     (los números sí se aceptan con decimales: el servidor los redondea)
--   · los errores esperables (usuario ocupado, no existe, tope…) SIEMPRE llegan con HTTP 200 y {"ok":false,"error":"…"}
--   · si una función puede dar varios, se revisan en el orden en que aparecen listados abajo: gana el primero.
-- FORMATOS: fechas 'YYYY-MM-DD' (el día LOCAL de la persona); horas ISO 8601 con zona, solo en lo tuyo (nunca de otros).
--   "hoy(UTC)" = la fecha UTC del servidor en ese momento. Todas las ventanas (30 días, el −3/+1 de p_day, el día
--   del freno de follow, los cortes) se cuentan en UTC.
--
-- ── Los CORTES (no es en tiempo real) ────────────────────────────────────────────────────────────────────────
--   Lo que ven los demás se publica por bloques fijos de 6 h UTC. corte = inicio del bloque actual: 00:00, 06:00,
--   12:00 o 18:00 UTC. Cada fila de resumen se muestra en su versión VISIBLE:
--     · no ha cambiado desde antes del corte        → sus valores de ahora;
--     · cambió después del corte, pero ya existía    → cómo estaba justo en el corte;
--     · se creó después del corte                    → todavía no se ve (como si no existiera).
--   O sea: lo que mandas con summary_push lo ven los demás (y tu preview) a partir del siguiente corte. Apagar un
--   interruptor, en cambio, aplica AL INSTANTE: se enmascara en cada lectura y se borra de lo guardado.
--
-- ── La TARJETA de una persona (forma común de following, social_feed y profile_get.preview) ─────────────────
--   "shares":  {"train":true,"sigma":true,"food":false,"sleep":true}     ← sus interruptores de AHORA
--   "summary": {"day":"2026-10-15",                                       ← día más reciente con algo compartido
--               "trained":true,"split_day":"Push A","streak":9,           ← null si "entreno" está apagado
--               "sigma":18.40,"sigma_day":"2026-10-14",                   ← null si "σ" está apagado
--               "kcal":null,"kcal_goal":null,"protein":null,"carbs":null,"fat":null,"mamarre":null,  ← "kcal y macros"
--               "sleep_min":432,"sleep_score":81}                         ← null si "sueño" está apagado
--   "summary" sale de la versión VISIBLE (ver CORTES) de los días entre hoy(UTC)−30 y hoy(UTC)+1: el más reciente
--             que tenga al menos un dato de una categoría prendida.
--   "summary": null  ← los cuatro apagados, o nada que mostrar: tampoco se sabe cuándo registró.
--   Las 14 llaves de summary siempre vienen (con null si no se comparte o no se registró). No hay hora de registro.
--   OJO σ: sigma_day (de qué día es su última sesión) sale con "σ" aunque "entreno" esté apagado, y que σ cambie de
--          un día a otro también delata una sesión. El texto del interruptor σ en la app debe decirlo.
--   OJO texto ajeno: username, display_name y split_day los escribió otra persona. La app los pinta SIEMPRE con
--          textContent o escTxt(), nunca dentro de innerHTML sin escapar: la base quita < >, controles e
--          invisibles, pero comillas, ' y & sí llegan (son legítimos: «Push & Pull», «D'Angelo»).
--
-- ── profile_get() ──────────────────────────────────────────────────────────────────── body: {}
--   → null                                   ← aún no tienes perfil
--   → {"username":"dan_lifts","display_name":"Dan","share_train":true,"share_sigma":true,"share_food":false,
--      "share_sleep":true,"following_count":12,"preview":{…summary, como te ven, con el retraso del corte…}|null,
--      "created_at":"2026-10-15T18:02:11.51+00:00","updated_at":"2026-10-15T18:05:40.1+00:00"}
--   errores propios: ninguno.
--
-- ── profile_set(p_username text = null, p_display_name text = null, p_share_train boolean = null,
--                p_share_sigma boolean = null, p_share_food boolean = null, p_share_sleep boolean = null)
--   body ej.: {"p_username":"Dan_Lifts","p_display_name":"Dan","p_share_train":true}
--   Crea o cambia TU perfil. Lo omitido o null se queda como estaba (al crear: los 4 interruptores en false).
--   · p_username: se le quita el '@' inicial y se pasa a minúsculas; debe quedar en ^[a-z0-9_]{3,20}$. Obligatorio al crear.
--   · p_display_name, en este orden: saltos de línea, tabs y espacios raros → un espacio; se quitan < >, controles e
--     invisibles (se conserva el unidor U+200D de los emoji compuestos); otra vez sin espacios dobles; sin espacios
--     en las orillas; se corta a 30. "" —o un nombre que solo tenga espacios o invisibles— lo borra (queda null).
--   Se revisa en este orden (gana el primero):
--   → {"ok":false,"error":"bad_username"}   ← formato inválido, o no mandaste usuario y aún no tienes perfil
--   → {"ok":false,"error":"reserved"}       ← @usuario reservado (ver abajo)
--   → {"ok":false,"error":"taken"}          ← ya es de otra persona
--   → {"ok":false,"error":"reserved"}       ← nombre visible que se hace pasar por la marca o por soporte (ver abajo)
--   → {"ok":false,"error":"taken"}          ← otra persona tomó ese @usuario en el mismo instante
--   → {"ok":true,"profile":{…lo mismo que profile_get…}}
--   Reservado (solo se revisa si el @usuario o el nombre CAMBIA; lo que ya tenías se respeta):
--     · @usuario igual a uno de: admin, administrador, administrator, root, null, undefined, system, sistema, gymtrk,
--       gym_trk, trk, soporte, support, ayuda, help, staff, equipo, team, moderador, moderator, mod, oficial,
--       official, api, www, anon, anonimo, anonymous. También si, quitándole los _ y números de las orillas, los _
--       de en medio y leyendo 0→o 1→i 3→e 4→a 5→s 6→g 7→t 8→b 9→g, queda igual a uno ("admin_", "adm1n", "_root_99").
--     · @usuario (sin _ y con esa misma lectura de números) o nombre visible que CONTENGA: gymtrk, gimtrk, gymtrak,
--       gimtrak, gymtrck, soporte, support, oficial, official, moderador, moderator o administra. El nombre se lee
--       en forma NFKC, en minúsculas, con las letras cirílicas/griegas que parecen latinas cambiadas por estas, sin
--       nada que no sea a-z o 0-9, y con la misma lectura de números ("gym//TRK Soporte", "Ѕoporte" → reserved).
--   Efectos: apagar un interruptor borra esa parte de tus resúmenes guardados (también de la versión del corte);
--            apagar los 4 los borra completos. Después de PRENDER uno, la app vuelve a llamar summary_push del día
--            (si no, no hay nada que mostrar); los demás lo ven desde el siguiente corte.
--
-- ── profile_delete() ───────────────────────────────────────────────────────────────── body: {}
--   Sales de SOCIAL sin borrar tu cuenta: se borran tu perfil (ya no apareces en búsquedas), tus resúmenes, a quién
--   sigues y quién te sigue (desapareces de sus listas). Tu base (state_push / state_pull) no se toca. Si después
--   creas perfil otra vez, empiezas sin seguidores y con los 4 interruptores apagados (el freno diario de follow
--   no se reinicia).
--   → {"ok":true}                            ← también si no tenías perfil
--   errores propios: ninguno.
--
-- ── profile_search(p_q text) ─────────────────────────────────────────────────────── body: {"p_q":"da"}
--   Personas cuyo @usuario EMPIEZA con p_q ('@' inicial ignorado, minúsculas, 2 a 20 de a-z 0-9 _). No te incluye.
--   → [{"username":"dan_lifts","display_name":"Dan","following":false}, …]   ← máx. 20; el exacto primero, luego a-z
--   → []                                     ← búsqueda corta o inválida, o nadie coincide (nunca error)
--
-- ── follow(p_username text) ───────────────────────────────────────────────── body: {"p_username":"dan_lifts"}
--   No hace falta tener perfil propio para seguir. Se revisa en este orden (gana el primero):
--   → {"ok":false,"error":"not_found"}       ← no existe ese @usuario (o no tiene perfil)
--   → {"ok":false,"error":"self"}            ← eres tú
--   → {"ok":true,"already":true}             ← ya lo seguías (no cambia nada; gana aunque estés en un tope)
--   → {"ok":false,"error":"limit","max":300} ← ya sigues a 300 personas
--   → {"ok":false,"error":"rate_limited","max":100}  ← ya llegaste a 100 intentos de seguir a alguien nuevo hoy
--                                              (UTC). Cuenta cada intento que pasa las revisiones anteriores,
--                                              también los rechazados; el 101.º del día ya sale así. Mañana se libera.
--   → {"ok":true}                            ← listo: ahora lo sigues
--
-- ── unfollow(p_username text) ─────────────────────────────────────────────── body: {"p_username":"dan_lifts"}
--   Se revisa en este orden: not_found → self → listo.
--   → {"ok":false,"error":"not_found"}  ·  {"ok":false,"error":"self"}
--   → {"ok":true}                            ← dejaste de seguirlo (también si no lo seguías)
--
-- ── following() ──────────────────────────────────────────────────────────────────── body: {}
--   → [{"username":"dan_lifts","display_name":"Dan","since":"2026-10-15T18:10:00+00:00",
--       "shares":{…},"summary":{…}|null}, …]                               ← orden alfabético; [] si no sigues a nadie
--   ("since" = cuándo lo seguiste TÚ.) No existe forma de ver a quién sigue otra persona ni quién te sigue.
--
-- ── summary_push(p_day date, p_trained boolean = null, p_split_day text = null, p_sigma numeric = null,
--                 p_sigma_day date = null, p_kcal numeric = null, p_kcal_goal numeric = null,
--                 p_protein numeric = null, p_carbs numeric = null, p_fat numeric = null,
--                 p_sleep_min numeric = null, p_sleep_score numeric = null, p_streak numeric = null,
--                 p_mamarre boolean = null)
--   body ej.: {"p_day":"2026-10-15","p_trained":true,"p_split_day":"Push A","p_streak":9,"p_sigma":18.4,
--              "p_sigma_day":"2026-10-15","p_kcal":2150,"p_kcal_goal":2400,"p_protein":160,"p_carbs":220,
--              "p_fat":70,"p_mamarre":false,"p_sleep_min":432,"p_sleep_score":81}
--   Reemplaza TU fila de ese día completa (lo omitido queda vacío): la app manda siempre el resumen entero del día.
--   Los demás lo ven a partir del siguiente corte (ver CORTES).
--   Sugerido para la app: p_trained = true si entrenó; false si el día ya terminó sin entreno; null si aún no se sabe.
--   Se revisa en este orden: 'bad_day' → not_sharing → se guarda.
--   Rangos (fuera de rango → ese campo se ignora y se nombra en "ignored"; el resto SÍ se guarda):
--     p_day        de hoy(UTC) − 3 a hoy(UTC) + 1 (ninguna zona horaria va más adelante); fuera → todo el envío se
--                  rechaza con 'bad_day' (aunque tengas los 4 interruptores apagados)
--     p_split_day  se limpia igual que el nombre visible (ver profile_set) y se corta a 40; si no queda nada
--                  visible → "split_day"
--     p_streak 0–10000 · p_sigma 0–1000 (2 decimales) con p_sigma_day entre p_day − 3650 y p_day (los dos o ninguno → "sigma")
--     p_kcal y p_kcal_goal 0–20000 · p_protein, p_carbs, p_fat 0–2000 g · p_sleep_min 0–1440 · p_sleep_score 0–100
--     los números se redondean a entero (σ a 2 decimales); NaN o infinito → ignorado
--   "ignored" se arma ANTES de aplicar tus interruptores (un campo fuera de rango de una categoría apagada también
--   sale) y siempre en este orden: split_day, streak, sigma, kcal, kcal_goal, protein, carbs, fat, sleep_min, sleep_score.
--   Solo se guarda lo que tienes PRENDIDO ahora (lo demás se descarta, no se guarda "por si acaso").
--   Al final se borran tus resúmenes de hace más de 30 días.
--   → {"ok":false,"error":"bad_day"}
--   → {"ok":true,"stored":false,"reason":"not_sharing"}   ← sin perfil o con los 4 apagados: no se guarda nada
--   → {"ok":true,"stored":true,"day":"2026-10-15","ignored":[],
--      "shares":{"train":true,"sigma":true,"food":false,"sleep":true}}
--   → {"ok":true,"stored":true,"day":"2026-10-15","ignored":["kcal","sleep_score"],"shares":{…}}
--
-- ── social_feed() ────────────────────────────────────────────────────────────────── body: {}
--   → [{"username":"dan_lifts","display_name":"Dan","shares":{…},"summary":{…}|null}, …]
--     orden: summary.day más reciente primero (empate → @usuario a-z); quienes no muestran nada al final, a-z;
--     [] si no sigues a nadie.
--
-- REGLAS QUE EL SERVIDOR FALSO DEBE IMITAR (además de las formas de arriba):
--   1) Todo se hace a nombre del que llama; no hay parámetro para actuar por otro.
--   2) Lo de otros se enmascara con sus interruptores ACTUALES en cada lectura; la hora de registro nunca sale.
--   3) summary = de la versión VISIBLE de cada fila (ver CORTES), el día más reciente entre hoy(UTC)−30 y
--      hoy(UTC)+1 que tenga al menos un dato de una categoría prendida; si no hay, null. Lo nuevo se ve desde el
--      siguiente corte (00/06/12/18 UTC); apagar un interruptor aplica al instante.
--   4) summary_push guarda solo categorías prendidas; profile_set al apagar borra esa categoría de las filas
--      guardadas (también de su versión del corte), y con las 4 apagadas borra las filas.
--   5) Topes de follow: 300 seguidos en total y 100 intentos nuevos por día (UTC); no se sigue a uno mismo;
--      seguir/dejar de seguir dos veces no falla. profile_delete borra perfil, resúmenes y seguimientos en los dos
--      sentidos, y nunca falla.
--   6) Ninguna tabla se usa por /rest/v1/<tabla> (user_state, user_state_hist, profiles, follows, follow_quota,
--      day_summary): cualquier lectura o escritura directa → error (permiso negado: 401 con la llave pública sola,
--      403 con sesión; o 404 si la API ni la lista). La copia de la base va SOLO por state_push / state_pull.
--   7) Fechas y ventanas siempre en UTC (hoy(UTC), los 30 días, el −3/+1 de p_day, el día del freno de follow, los
--      cortes de 6 h). Cuando hay varios errores posibles, gana el primero en el orden listado en cada función.
