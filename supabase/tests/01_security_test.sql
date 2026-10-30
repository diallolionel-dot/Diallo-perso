-- Tests de sécurité : RLS, attribution XP, contraintes, stockage privé, export et suppression.
\set ON_ERROR_STOP 1
create or replace function pg_temp.expect_error(sql text, label text) returns void language plpgsql as $$
begin
  begin
    execute sql;
  exception when others then
    raise notice 'OK (refusé) : % -> %', label, sqlerrm;
    return;
  end;
  raise exception 'ÉCHEC : % aurait dû être refusé', label;
end $$;
create or replace function pg_temp.expect_eq(actual bigint, expected bigint, label text) returns void language plpgsql as $$
begin
  if actual is distinct from expected then raise exception 'ÉCHEC : % (obtenu %, attendu %)', label, actual, expected; end if;
  raise notice 'OK : %', label;
end $$;
grant execute on all functions in schema pg_temp to authenticated;

insert into auth.users values ('11111111-1111-1111-1111-111111111111','u1@x'),('22222222-2222-2222-2222-222222222222','u2@x');
select pg_temp.expect_eq((select count(*) from public.profiles), 2, 'profils créés automatiquement');

-- ===== Utilisateur 1 =====
set role authenticated; set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
insert into public.weight_entries (weight_kg) values (92.0), (91.4);
insert into public.meals (slot, title, kcal, photo_path) values ('dejeuner','Poulet riz', 640, '11111111-1111-1111-1111-111111111111/meals/a.jpg');
insert into public.workouts (id, kind, title, duration_min) values ('aaaaaaaa-0000-0000-0000-000000000001','combat','MMA',90);
insert into public.workout_exercises (workout_id, name, sets) values ('aaaaaaaa-0000-0000-0000-000000000001','Sparring','[{"duration_s":180}]');
insert into public.daily_checkins (day, sleep_hours, energy) values ('2026-10-29', 6.5, 4);
update public.profiles set target_weight_kg = 80 where id = auth.uid();
select pg_temp.expect_eq((select count(*) from public.weight_entries), 2, 'u1 voit ses 2 pesées');
select pg_temp.expect_eq(public.award_xp('weigh_in', current_date)::bigint, 10, 'award_xp accorde 10 XP');
select pg_temp.expect_eq(public.award_xp('weigh_in', current_date)::bigint, 0, 'plafond journalier appliqué');
select pg_temp.expect_error($$ select public.award_xp('calories_burned', current_date) $$, 'action XP inconnue');
select pg_temp.expect_error($$ select public.award_xp('weigh_in', current_date - 30) $$, 'XP antidatée');
select pg_temp.expect_error($$ insert into public.xp_events (user_id, action, xp, occurred_on) values (auth.uid(),'weigh_in',999,current_date) $$, 'insertion XP directe');
select pg_temp.expect_error($$ insert into public.coach_messages (role, content) values ('assistant','faux coach') $$, 'message assistant forgé');
insert into public.coach_messages (role, content) values ('user','Salut coach');
select pg_temp.expect_error($$ insert into public.weight_entries (weight_kg) values (500) $$, 'poids hors bornes');
select pg_temp.expect_error($$ insert into public.meals (slot, title, photo_path) values ('diner','x','22222222-2222-2222-2222-222222222222/meals/b.jpg') $$, 'chemin photo d''un autre utilisateur');
select pg_temp.expect_error($$ insert into public.workouts (kind, title, is_planned_rest) values ('combat','x',true) $$, 'repos planifié incohérent');
insert into storage.objects (bucket_id, name) values ('private-media','11111111-1111-1111-1111-111111111111/meals/a.jpg');
select pg_temp.expect_error($$ insert into storage.objects (bucket_id, name) values ('private-media','22222222-2222-2222-2222-222222222222/meals/x.jpg') $$, 'upload dans le dossier d''un autre');
select pg_temp.expect_eq((select jsonb_array_length(public.export_my_data()->'weight_entries'))::bigint, 2, 'export contient les pesées');

-- ===== Utilisateur 2 =====
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select pg_temp.expect_eq((select count(*) from public.weight_entries), 0, 'u2 ne voit pas les pesées de u1');
select pg_temp.expect_eq((select count(*) from public.meals), 0, 'u2 ne voit pas les repas de u1');
select pg_temp.expect_eq((select count(*) from public.profiles), 1, 'u2 ne voit que son profil');
select pg_temp.expect_eq((select count(*) from public.xp_events), 0, 'u2 ne voit pas l''XP de u1');
select pg_temp.expect_eq((select count(*) from storage.objects), 0, 'u2 ne voit pas les photos de u1');
select pg_temp.expect_error($$ insert into public.weight_entries (user_id, weight_kg) values ('11111111-1111-1111-1111-111111111111', 80) $$, 'écriture au nom de u1');
select pg_temp.expect_error($$ insert into public.workout_exercises (workout_id, name) values ('aaaaaaaa-0000-0000-0000-000000000001','Intrus') $$, 'exercice dans la séance de u1');
update public.weight_entries set weight_kg = 50;
delete from public.meals;
select pg_temp.expect_eq((select jsonb_array_length(public.export_my_data()->'weight_entries'))::bigint, 0, 'export de u2 vide');

-- ===== Anonyme =====
set role anon; set request.jwt.claim.sub = '';
select pg_temp.expect_eq((select count(*) from public.weight_entries), 0, 'anonyme ne voit rien');
select pg_temp.expect_error($$ select public.export_my_data() $$, 'export anonyme');

-- ===== Retour u1 : rien n'a été altéré par u2, puis suppression =====
set role authenticated; set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select pg_temp.expect_eq((select count(*) from public.weight_entries where weight_kg = 50), 0, 'u2 n''a pas pu modifier les pesées de u1');
select pg_temp.expect_eq((select count(*) from public.meals), 1, 'u2 n''a pas pu supprimer les repas de u1');
select public.delete_my_data();
select pg_temp.expect_eq((select count(*) from public.weight_entries) + (select count(*) from public.meals) + (select count(*) from public.workouts) + (select count(*) from public.xp_events) + (select count(*) from public.coach_messages), 0, 'delete_my_data efface tout le suivi');
reset role;
delete from auth.users where id = '11111111-1111-1111-1111-111111111111';
select pg_temp.expect_eq((select count(*) from public.profiles), 1, 'suppression du compte en cascade');
\echo TESTS PHASE 1 RÉUSSIS
