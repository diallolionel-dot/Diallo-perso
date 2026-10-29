-- =====================================================================
-- DIALLO COACHING — schéma initial (préparé en phase 1, appliqué en phase 2)
--
-- Principes :
--   * Chaque ligne appartient à un utilisateur (user_id) ; RLS activée partout.
--   * Les photos vivent dans un bucket PRIVÉ, sous le préfixe {user_id}/.
--   * L'XP n'est jamais écrite directement par le client : seule la fonction
--     award_xp() l'attribue, selon la table xp_rules (aucune règle liée aux
--     calories ou à la restriction alimentaire).
--   * Export et suppression des données via fonctions dédiées.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Utilitaires
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- profiles : 1 ligne par utilisateur, créée automatiquement
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  height_cm numeric(5, 1) check (height_cm between 100 and 250),
  birth_year smallint check (birth_year between 1920 and 2020),
  start_weight_kg numeric(5, 2) check (start_weight_kg between 30 and 300),
  target_weight_kg numeric(5, 2) check (target_weight_kg between 30 and 300),
  start_date date,
  daily_calories_target integer check (daily_calories_target between 800 and 6000),
  daily_protein_target_g integer check (daily_protein_target_g between 0 and 500),
  -- Dossier athlète transmis au Mentor (objectifs, contraintes, préférences).
  coach_context text check (char_length(coach_context) <= 8000),
  timezone text not null default 'Europe/Paris',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- weight_entries
-- ---------------------------------------------------------------------
create table public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  measured_at timestamptz not null default now(),
  weight_kg numeric(5, 2) not null check (weight_kg between 30 and 300),
  body_fat_pct numeric(4, 1) check (body_fat_pct between 2 and 70),
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now()
);
create index weight_entries_user_date on public.weight_entries (user_id, measured_at desc);

-- ---------------------------------------------------------------------
-- meals
-- ---------------------------------------------------------------------
create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  eaten_at timestamptz not null default now(),
  slot text not null check (slot in ('petit_dejeuner', 'dejeuner', 'collation', 'diner')),
  title text not null check (char_length(title) between 1 and 160),
  kcal integer check (kcal between 0 and 5000),
  protein_g numeric(5, 1) check (protein_g between 0 and 500),
  carbs_g numeric(5, 1) check (carbs_g between 0 and 1000),
  fat_g numeric(5, 1) check (fat_g between 0 and 500),
  -- 'ai_estimate' = valeurs proposées par l'IA, toujours modifiables.
  source text not null default 'manual' check (source in ('manual', 'ai_estimate')),
  photo_path text,
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (photo_path is null or photo_path like (user_id::text || '/%'))
);
create index meals_user_date on public.meals (user_id, eaten_at desc);
create trigger meals_updated_at before update on public.meals
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- workouts & workout_exercises
-- ---------------------------------------------------------------------
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  started_at timestamptz not null default now(),
  kind text not null check (kind in ('combat', 'force', 'cardio', 'mobilite', 'repos')),
  title text not null check (char_length(title) between 1 and 120),
  duration_min integer not null default 0 check (duration_min between 0 and 600),
  perceived_effort smallint check (perceived_effort between 1 and 10),
  is_planned_rest boolean not null default false,
  photo_path text,
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not is_planned_rest or kind = 'repos'),
  check (photo_path is null or photo_path like (user_id::text || '/%'))
);
create index workouts_user_date on public.workouts (user_id, started_at desc);
create trigger workouts_updated_at before update on public.workouts
  for each row execute function public.set_updated_at();

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  position smallint not null default 0 check (position between 0 and 100),
  name text not null check (char_length(name) between 1 and 120),
  -- [{ "reps": 8, "load_kg": 70 }, { "duration_s": 45 }, ...]
  sets jsonb not null default '[]'::jsonb
    check (jsonb_typeof(sets) = 'array' and jsonb_array_length(sets) <= 30),
  created_at timestamptz not null default now()
);
create index workout_exercises_workout on public.workout_exercises (workout_id, position);
create index workout_exercises_user on public.workout_exercises (user_id);

-- ---------------------------------------------------------------------
-- body_measurements
-- ---------------------------------------------------------------------
create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  measured_on date not null default current_date,
  waist_cm numeric(5, 1) check (waist_cm between 10 and 250),
  hips_cm numeric(5, 1) check (hips_cm between 10 and 250),
  chest_cm numeric(5, 1) check (chest_cm between 10 and 250),
  arm_cm numeric(5, 1) check (arm_cm between 10 and 250),
  thigh_cm numeric(5, 1) check (thigh_cm between 10 and 250),
  neck_cm numeric(5, 1) check (neck_cm between 10 and 250),
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  check (coalesce(waist_cm, hips_cm, chest_cm, arm_cm, thigh_cm, neck_cm) is not null)
);
create index body_measurements_user_date on public.body_measurements (user_id, measured_on desc);

-- ---------------------------------------------------------------------
-- progress_photos (métadonnées ; fichiers dans le bucket privé)
-- ---------------------------------------------------------------------
create table public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  taken_on date not null default current_date,
  pose text not null check (pose in ('face', 'profil', 'dos', 'autre')),
  storage_path text not null unique,
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  check (storage_path like (user_id::text || '/%'))
);
create index progress_photos_user_date on public.progress_photos (user_id, taken_on desc);

-- ---------------------------------------------------------------------
-- daily_checkins (sommeil, énergie, stress, faim)
-- ---------------------------------------------------------------------
create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null,
  sleep_hours numeric(3, 1) check (sleep_hours between 0 and 24),
  sleep_quality smallint check (sleep_quality between 1 and 5),
  energy smallint check (energy between 1 and 5),
  stress smallint check (stress between 1 and 5),
  hunger smallint check (hunger between 1 and 5),
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, day)
);
create trigger daily_checkins_updated_at before update on public.daily_checkins
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- XP : règles + événements
-- ---------------------------------------------------------------------
-- Doit rester synchronisé avec src/lib/rpg/xp.ts (vérifié par un test).
create table public.xp_rules (
  action text primary key,
  xp integer not null check (xp > 0),
  daily_cap integer not null check (daily_cap >= 1)
);

insert into public.xp_rules (action, xp, daily_cap) values
  ('weigh_in', 10, 1),
  ('meal_logged', 5, 5),
  ('workout_logged', 25, 2),
  ('planned_rest', 15, 1),
  ('sleep_logged', 5, 1),
  ('measurements_logged', 20, 1),
  ('progress_photo', 15, 1),
  ('daily_checkin', 10, 1),
  ('weekly_review', 30, 1),
  ('consistency_week', 50, 1);

create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null references public.xp_rules (action),
  xp integer not null check (xp > 0),
  occurred_on date not null,
  source_id uuid,
  created_at timestamptz not null default now(),
  unique (user_id, action, source_id)
);
create index xp_events_user_date on public.xp_events (user_id, occurred_on desc);

-- Seul point d'entrée pour gagner de l'XP. Applique le plafond journalier,
-- ignore les doublons, ne retire jamais d'XP.
create or replace function public.award_xp(p_action text, p_occurred_on date, p_source_id uuid default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_rule public.xp_rules%rowtype;
  v_count integer;
begin
  if v_user is null then
    raise exception 'authentification requise';
  end if;

  select * into v_rule from public.xp_rules where action = p_action;
  if not found then
    raise exception 'action XP inconnue : %', p_action;
  end if;

  if p_occurred_on > current_date + 1 or p_occurred_on < current_date - 7 then
    raise exception 'date hors de la fenêtre autorisée';
  end if;

  select count(*) into v_count
  from public.xp_events
  where user_id = v_user and action = p_action and occurred_on = p_occurred_on;

  if v_count >= v_rule.daily_cap then
    return 0;
  end if;

  insert into public.xp_events (user_id, action, xp, occurred_on, source_id)
  values (v_user, p_action, v_rule.xp, p_occurred_on, p_source_id)
  on conflict (user_id, action, source_id) do nothing;

  return case when found then v_rule.xp else 0 end;
end;
$$;

revoke all on function public.award_xp(text, date, uuid) from public, anon;
grant execute on function public.award_xp(text, date, uuid) to authenticated;

-- ---------------------------------------------------------------------
-- achievements (débloqués côté serveur)
-- ---------------------------------------------------------------------
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  code text not null check (char_length(code) between 1 and 60),
  unlocked_at timestamptz not null default now(),
  unique (user_id, code)
);

-- ---------------------------------------------------------------------
-- coach_messages
-- ---------------------------------------------------------------------
create table public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 8000),
  created_at timestamptz not null default now()
);
create index coach_messages_user_date on public.coach_messages (user_id, created_at desc);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.weight_entries enable row level security;
alter table public.meals enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.body_measurements enable row level security;
alter table public.progress_photos enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.xp_rules enable row level security;
alter table public.xp_events enable row level security;
alter table public.achievements enable row level security;
alter table public.coach_messages enable row level security;

-- profiles : lecture / mise à jour de son propre profil (création via trigger).
create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Tables de suivi : CRUD complet limité à ses propres lignes.
do $$
declare
  t text;
begin
  foreach t in array array[
    'weight_entries', 'meals', 'workouts', 'body_measurements',
    'progress_photos', 'daily_checkins'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)',
      t || '_select_own', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',
      t || '_insert_own', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t || '_update_own', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',
      t || '_delete_own', t);
  end loop;
end;
$$;

-- workout_exercises : en plus, la séance parente doit appartenir à l'utilisateur.
create policy "workout_exercises_select_own" on public.workout_exercises
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "workout_exercises_insert_own" on public.workout_exercises
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = (select auth.uid()))
  );
create policy "workout_exercises_update_own" on public.workout_exercises
  for update to authenticated using ((select auth.uid()) = user_id) with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = (select auth.uid()))
  );
create policy "workout_exercises_delete_own" on public.workout_exercises
  for delete to authenticated using ((select auth.uid()) = user_id);

-- xp_rules : lecture seule.
create policy "xp_rules_read" on public.xp_rules for select to authenticated using (true);

-- xp_events / achievements : lecture seule (écriture via award_xp ou clé secrète).
create policy "xp_events_select_own" on public.xp_events
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "achievements_select_own" on public.achievements
  for select to authenticated using ((select auth.uid()) = user_id);

-- coach_messages : l'utilisateur lit son fil et n'écrit que ses propres messages ;
-- les réponses du Mentor sont écrites par le serveur (clé secrète).
create policy "coach_messages_select_own" on public.coach_messages
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "coach_messages_insert_own" on public.coach_messages
  for insert to authenticated with check ((select auth.uid()) = user_id and role = 'user');
create policy "coach_messages_delete_own" on public.coach_messages
  for delete to authenticated using ((select auth.uid()) = user_id);

-- =====================================================================
-- Stockage privé des photos : bucket "private-media"
-- Arborescence : {user_id}/{meals|workouts|progress|weigh-ins}/{uuid}.{ext}
-- Accès en lecture uniquement via URLs signées générées côté serveur.
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'private-media', 'private-media', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "private_media_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'private-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "private_media_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'private-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "private_media_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'private-media' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'private-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "private_media_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'private-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- =====================================================================
-- Export & suppression des données
-- =====================================================================

-- Exporte toutes les données de l'utilisateur courant (RLS appliquée).
create or replace function public.export_my_data()
returns jsonb
language sql
security invoker
set search_path = ''
stable
as $$
  select jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) from public.profiles p where p.id = auth.uid()),
    'weight_entries', coalesce((select jsonb_agg(t order by t.measured_at) from public.weight_entries t), '[]'::jsonb),
    'meals', coalesce((select jsonb_agg(t order by t.eaten_at) from public.meals t), '[]'::jsonb),
    'workouts', coalesce((select jsonb_agg(t order by t.started_at) from public.workouts t), '[]'::jsonb),
    'workout_exercises', coalesce((select jsonb_agg(t order by t.workout_id, t.position) from public.workout_exercises t), '[]'::jsonb),
    'body_measurements', coalesce((select jsonb_agg(t order by t.measured_on) from public.body_measurements t), '[]'::jsonb),
    'progress_photos', coalesce((select jsonb_agg(t order by t.taken_on) from public.progress_photos t), '[]'::jsonb),
    'daily_checkins', coalesce((select jsonb_agg(t order by t.day) from public.daily_checkins t), '[]'::jsonb),
    'xp_events', coalesce((select jsonb_agg(t order by t.occurred_on) from public.xp_events t), '[]'::jsonb),
    'achievements', coalesce((select jsonb_agg(t order by t.unlocked_at) from public.achievements t), '[]'::jsonb),
    'coach_messages', coalesce((select jsonb_agg(t order by t.created_at) from public.coach_messages t), '[]'::jsonb)
  );
$$;

revoke all on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;

-- Efface les données de suivi de l'utilisateur courant (le compte est conservé).
-- Les fichiers du bucket doivent être supprimés via l'API Storage côté serveur
-- AVANT l'appel ; la suppression complète du compte passe par l'API admin
-- (clé secrète, côté serveur), qui déclenche les ON DELETE CASCADE.
create or replace function public.delete_my_data()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'authentification requise';
  end if;

  delete from public.coach_messages where user_id = v_user;
  delete from public.achievements where user_id = v_user;
  delete from public.xp_events where user_id = v_user;
  delete from public.daily_checkins where user_id = v_user;
  delete from public.progress_photos where user_id = v_user;
  delete from public.body_measurements where user_id = v_user;
  delete from public.workout_exercises where user_id = v_user;
  delete from public.workouts where user_id = v_user;
  delete from public.meals where user_id = v_user;
  delete from public.weight_entries where user_id = v_user;
  update public.profiles set
    display_name = null, height_cm = null, birth_year = null,
    start_weight_kg = null, target_weight_kg = null, start_date = null,
    daily_calories_target = null, daily_protein_target_g = null, coach_context = null
  where id = v_user;
end;
$$;

revoke all on function public.delete_my_data() from public, anon;
grant execute on function public.delete_my_data() to authenticated;
