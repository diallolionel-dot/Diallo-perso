-- =====================================================================
-- DIALLO COACHING — phase 2 : saisies réelles
--
--   * Photo facultative sur les pesées (lecture du chiffre par l'IA en phase 3).
--   * Check-in enrichi : douleur / blessure et charge de travail du jour,
--     pour que le Mentor adapte ses recommandations (phase 3).
--   * Semaine régulière : bonus d'XP au plus une fois par semaine ISO.
--   * Succès : débloqués côté base, jamais par le client.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Colonnes supplémentaires
-- ---------------------------------------------------------------------
alter table public.weight_entries
  add column photo_path text,
  add constraint weight_entries_photo_path_owner
    check (photo_path is null or photo_path like (user_id::text || '/%'));

alter table public.daily_checkins
  add column pain_level smallint check (pain_level between 0 and 10),
  add column pain_zone text check (char_length(pain_zone) <= 80),
  add column work_load smallint check (work_load between 1 and 5);

-- ---------------------------------------------------------------------
-- Semaine régulière : 5 jours suivis sur les 7 derniers, une fois par semaine ISO
-- ---------------------------------------------------------------------
create or replace function public.check_consistency_week(p_today date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_days integer;
  v_xp integer;
begin
  if v_user is null then
    raise exception 'authentification requise';
  end if;

  if p_today > current_date + 1 or p_today < current_date - 1 then
    raise exception 'date hors de la fenêtre autorisée';
  end if;

  if exists (
    select 1 from public.xp_events
    where user_id = v_user
      and action = 'consistency_week'
      and date_trunc('week', occurred_on) = date_trunc('week', p_today)
  ) then
    return 0;
  end if;

  select count(distinct occurred_on) into v_days
  from public.xp_events
  where user_id = v_user
    and action <> 'consistency_week'
    and occurred_on between p_today - 6 and p_today;

  if v_days < 5 then
    return 0;
  end if;

  select xp into v_xp from public.xp_rules where action = 'consistency_week';

  insert into public.xp_events (user_id, action, xp, occurred_on)
  values (v_user, 'consistency_week', v_xp, p_today);

  return v_xp;
end;
$$;

revoke all on function public.check_consistency_week(date) from public, anon;
grant execute on function public.check_consistency_week(date) to authenticated;

-- ---------------------------------------------------------------------
-- Succès : catalogue (libellés dans src/lib/rpg/achievements.ts, synchronisé par un test)
-- ---------------------------------------------------------------------
create or replace function public.refresh_achievements()
returns setof text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_start numeric;
  v_target numeric;
  v_latest numeric;
  v_codes text[] := array[]::text[];
begin
  if v_user is null then
    raise exception 'authentification requise';
  end if;

  select start_weight_kg, target_weight_kg into v_start, v_target
  from public.profiles where id = v_user;

  select weight_kg into v_latest
  from public.weight_entries where user_id = v_user
  order by measured_at desc limit 1;

  if exists (select 1 from public.weight_entries where user_id = v_user) then
    v_codes := array_append(v_codes, 'premier_pas');
  end if;

  if exists (select 1 from public.workouts where user_id = v_user and not is_planned_rest) then
    v_codes := array_append(v_codes, 'premiere_arene');
  end if;

  if (select count(distinct occurred_on) from public.xp_events where user_id = v_user) >= 7 then
    v_codes := array_append(v_codes, 'sept_soleils');
  end if;

  if (select count(*) from public.workouts where user_id = v_user and is_planned_rest) >= 4 then
    v_codes := array_append(v_codes, 'repos_du_sage');
  end if;

  if exists (select 1 from public.xp_events where user_id = v_user and action = 'consistency_week') then
    v_codes := array_append(v_codes, 'semaine_reguliere');
  end if;

  if v_start is not null and v_latest is not null then
    if v_latest <= v_start - 2 then
      v_codes := array_append(v_codes, 'cap_moins_2');
    end if;
    if v_target is not null and v_target < v_start then
      if v_latest <= v_start - (v_start - v_target) / 2 then
        v_codes := array_append(v_codes, 'mi_parcours');
      end if;
      if v_latest <= v_target then
        v_codes := array_append(v_codes, 'objectif_atteint');
      end if;
    end if;
  end if;

  return query
    insert into public.achievements (user_id, code)
    select v_user, c from unnest(v_codes) as c
    on conflict (user_id, code) do nothing
    returning code;
end;
$$;

revoke all on function public.refresh_achievements() from public, anon;
grant execute on function public.refresh_achievements() to authenticated;
