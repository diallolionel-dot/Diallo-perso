-- Tests phase 2 : photo de pesée, check-in enrichi, semaine régulière, succès.
\set ON_ERROR_STOP 1
grant execute on all functions in schema pg_temp to authenticated;

insert into auth.users values ('33333333-3333-3333-3333-333333333333','u3@x'),('44444444-4444-4444-4444-444444444444','u4@x');

set role authenticated; set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
update public.profiles set start_weight_kg = 92, target_weight_kg = 80 where id = auth.uid();

insert into public.weight_entries (weight_kg, measured_at, photo_path)
  values (92, now() - interval '3 days', '33333333-3333-3333-3333-333333333333/weigh-ins/a.jpg');
select pg_temp.expect_error($$ insert into public.weight_entries (weight_kg, photo_path) values (91, '44444444-4444-4444-4444-444444444444/weigh-ins/x.jpg') $$, 'photo de pesée dans le dossier d''un autre');

insert into public.daily_checkins (day, sleep_hours, pain_level, pain_zone, work_load) values (current_date, 6, 3, 'genou gauche', 4);
select pg_temp.expect_error($$ insert into public.daily_checkins (day, pain_level) values (current_date - 1, 11) $$, 'douleur hors échelle');
select pg_temp.expect_error($$ insert into public.daily_checkins (day, work_load) values (current_date - 2, 0) $$, 'charge de travail hors échelle');

-- Semaine régulière : 4 jours suivis ne suffisent pas, 5 jours oui, une seule fois par semaine.
select public.award_xp('daily_checkin', current_date - d) from generate_series(1, 4) as d;
select pg_temp.expect_eq(public.check_consistency_week(current_date)::bigint, 0, '4 jours sur 7 : pas de bonus');
select public.award_xp('daily_checkin', current_date);
select pg_temp.expect_eq(public.check_consistency_week(current_date)::bigint, 50, '5 jours sur 7 : bonus de 50 XP');
select pg_temp.expect_eq(public.check_consistency_week(current_date)::bigint, 0, 'bonus accordé une seule fois par semaine');
select pg_temp.expect_error($$ select public.check_consistency_week(current_date - 10) $$, 'semaine régulière antidatée');

-- Succès
insert into public.weight_entries (weight_kg, measured_at) values (89.5, now());
select pg_temp.expect_eq((select count(*) from public.refresh_achievements() c where c in ('premier_pas', 'cap_moins_2', 'semaine_reguliere')), 3, 'succès débloqués : premier pas, cap des -2 kg, semaine régulière');
select pg_temp.expect_eq((select count(*) from public.achievements where code in ('mi_parcours', 'objectif_atteint', 'sept_soleils')), 0, 'pas de succès non mérité');
select pg_temp.expect_eq((select count(*) from public.refresh_achievements()), 0, 'aucun doublon au second appel');
insert into public.weight_entries (weight_kg, measured_at) values (85.8, now() + interval '1 minute');
select pg_temp.expect_eq((select count(*) from public.refresh_achievements() c where c = 'mi_parcours'), 1, 'mi-parcours à 86 kg');
insert into public.workouts (kind, title, is_planned_rest) select 'repos', 'Repos', true from generate_series(1, 4);
select pg_temp.expect_eq((select count(*) from public.refresh_achievements() c where c = 'repos_du_sage'), 1, '4 repos planifiés : repos du sage');
select pg_temp.expect_error($$ insert into public.achievements (user_id, code) values (auth.uid(), 'objectif_atteint') $$, 'succès forgé par le client');

set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
select pg_temp.expect_eq((select count(*) from public.achievements), 0, 'u4 ne voit pas les succès de u3');
select pg_temp.expect_eq((select count(*) from public.daily_checkins), 0, 'u4 ne voit pas les check-ins de u3');
select pg_temp.expect_eq(public.check_consistency_week(current_date)::bigint, 0, 'u4 sans suivi : pas de bonus');
reset role;
\echo TESTS PHASE 2 RÉUSSIS
