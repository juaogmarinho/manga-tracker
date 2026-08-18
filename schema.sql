-- Kitsune Tracker: esquema de produção (Supabase/Postgres)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Otaku',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.libraries (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{"works":[],"categories":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  id boolean primary key default true check (id),
  settings jsonb not null default '{"appName":"Kitsune","accent":"#ff7152","welcome":"Continue de onde parou."}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.app_settings(id) values (true) on conflict do nothing;

-- Assinatura VIP (pagamento via Mercado Pago)
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'inactive' check (status in ('inactive','active')),
  provider text not null default 'mercadopago',
  external_reference text,
  last_payment_id text,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Catálogo de mangás liberados para assinantes VIP
create table if not exists public.vip_manga (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  cover text,
  description text,
  read_url text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.libraries enable row level security;
alter table public.app_settings enable row level security;
alter table public.subscriptions enable row level security;
alter table public.vip_manga enable row level security;

create policy "Users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users read own library" on public.libraries for select using (auth.uid() = user_id);
create policy "Users write own library" on public.libraries for insert with check (auth.uid() = user_id);
create policy "Users update own library" on public.libraries for update using (auth.uid() = user_id);
create policy "Everyone reads public settings" on public.app_settings for select using (true);
create policy "Admins update settings" on public.app_settings for update using ((select is_admin from public.profiles where id = auth.uid()));

create policy "Users read own subscription" on public.subscriptions for select using (auth.uid() = user_id);
-- Nenhuma policy de insert/update para usuários comuns: a assinatura só é escrita pelo
-- webhook do Mercado Pago, que usa a chave service_role (que ignora RLS) no servidor.

create policy "VIP members and admins read manga catalog" on public.vip_manga for select using (
  exists (
    select 1 from public.subscriptions s
    where s.user_id = auth.uid() and s.status = 'active' and (s.expires_at is null or s.expires_at > now())
  )
  or (select is_admin from public.profiles where id = auth.uid())
);
create policy "Admins manage manga catalog" on public.vip_manga for insert with check ((select is_admin from public.profiles where id = auth.uid()));
create policy "Admins update manga catalog" on public.vip_manga for update using ((select is_admin from public.profiles where id = auth.uid()));
create policy "Admins delete manga catalog" on public.vip_manga for delete using ((select is_admin from public.profiles where id = auth.uid()));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'Otaku'));
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Após criar sua conta, promova o primeiro administrador pelo e-mail:
-- update public.profiles set is_admin = true where id = (select id from auth.users where email = 'seu@email.com');
