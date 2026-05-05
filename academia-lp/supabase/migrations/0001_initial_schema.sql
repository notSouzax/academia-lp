-- =========================================================
-- 0001_initial_schema.sql
-- Tablas iniciales de Academia LP + RLS + trigger profile-on-signup.
-- =========================================================

-- ---------- profiles ----------
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Own profile read"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Own profile update"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger: cada vez que se crea un user, se crea su profile automáticamente.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name, must_change_password)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', null), true);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- messages ----------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  image_url text,
  created_at timestamptz not null default now()
);

create index messages_user_id_created_at_idx
  on public.messages(user_id, created_at);

alter table public.messages enable row level security;

create policy "Own messages all"
  on public.messages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- conversation_summaries ----------
create table public.conversation_summaries (
  user_id uuid primary key references auth.users(id) on delete cascade,
  summary text not null default '',
  last_summarized_message_id uuid references public.messages(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.conversation_summaries enable row level security;

create policy "Own summary all"
  on public.conversation_summaries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- brain_cache_meta ----------
-- Singleton: una sola fila con id=1 para los metadatos del context cache de Gemini.
create table public.brain_cache_meta (
  id integer primary key default 1 check (id = 1),
  cache_id text,
  cache_expires_at timestamptz,
  brain_hash text,
  updated_at timestamptz not null default now()
);

-- Esta tabla NO tiene RLS pública: solo se accede desde el servidor con service_role
-- (los clientes nunca leen ni escriben aquí directamente). Por seguridad, sí activamos
-- RLS y dejamos la tabla bloqueada para todos los roles excepto service_role.
alter table public.brain_cache_meta enable row level security;
-- (sin policies → nadie puede leer/escribir; service_role omite RLS por defecto)

-- Insertar la fila singleton vacía
insert into public.brain_cache_meta (id) values (1);
