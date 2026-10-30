/**
 * Types de la base Supabase, alignés sur supabase/migrations/.
 *
 * Écrits à la main (migrations des phases 1 et 2). Une fois le projet Supabase créé, les régénérer avec :
 *   npx supabase gen types typescript --project-id <id> > src/types/database.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Timestamps = { created_at: string };

/** Construit Row / Insert / Update à partir des colonnes et des champs facultatifs à l'insertion. */
type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type TableDef<Row, OptionalOnInsert extends keyof Row, Relationships extends Relationship[] = []> = {
  Row: Row;
  Insert: Omit<Row, OptionalOnInsert> & Partial<Pick<Row, OptionalOnInsert>>;
  Update: Partial<Row>;
  Relationships: Relationships;
};

type ProfileRow = Timestamps & {
  id: string;
  display_name: string | null;
  height_cm: number | null;
  birth_year: number | null;
  start_weight_kg: number | null;
  target_weight_kg: number | null;
  start_date: string | null;
  daily_calories_target: number | null;
  daily_protein_target_g: number | null;
  coach_context: string | null;
  timezone: string;
  updated_at: string;
};

type WeightEntryRow = Timestamps & {
  id: string;
  user_id: string;
  measured_at: string;
  weight_kg: number;
  body_fat_pct: number | null;
  photo_path: string | null;
  note: string | null;
};

type MealRow = Timestamps & {
  id: string;
  user_id: string;
  eaten_at: string;
  slot: "petit_dejeuner" | "dejeuner" | "collation" | "diner";
  title: string;
  kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  source: "manual" | "ai_estimate";
  photo_path: string | null;
  note: string | null;
  updated_at: string;
};

type WorkoutRow = Timestamps & {
  id: string;
  user_id: string;
  started_at: string;
  kind: "combat" | "force" | "cardio" | "mobilite" | "repos";
  title: string;
  duration_min: number;
  perceived_effort: number | null;
  is_planned_rest: boolean;
  photo_path: string | null;
  note: string | null;
  updated_at: string;
};

type WorkoutExerciseRow = Timestamps & {
  id: string;
  workout_id: string;
  user_id: string;
  position: number;
  name: string;
  sets: Json;
};

type BodyMeasurementRow = Timestamps & {
  id: string;
  user_id: string;
  measured_on: string;
  waist_cm: number | null;
  hips_cm: number | null;
  chest_cm: number | null;
  arm_cm: number | null;
  thigh_cm: number | null;
  neck_cm: number | null;
  note: string | null;
};

type ProgressPhotoRow = Timestamps & {
  id: string;
  user_id: string;
  taken_on: string;
  pose: "face" | "profil" | "dos" | "autre";
  storage_path: string;
  note: string | null;
};

type DailyCheckinRow = Timestamps & {
  id: string;
  user_id: string;
  day: string;
  sleep_hours: number | null;
  sleep_quality: number | null;
  energy: number | null;
  stress: number | null;
  hunger: number | null;
  pain_level: number | null;
  pain_zone: string | null;
  work_load: number | null;
  note: string | null;
  updated_at: string;
};

type XpRuleRow = { action: string; xp: number; daily_cap: number };

type XpEventRow = Timestamps & {
  id: string;
  user_id: string;
  action: string;
  xp: number;
  occurred_on: string;
  source_id: string | null;
};

type AchievementRow = { id: string; user_id: string; code: string; unlocked_at: string };

type CoachMessageRow = Timestamps & {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
};

type Nullable<Row> = { [K in keyof Row]: null extends Row[K] ? K : never }[keyof Row];

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<ProfileRow, Nullable<ProfileRow> | "timezone" | "created_at" | "updated_at">;
      weight_entries: TableDef<WeightEntryRow, Nullable<WeightEntryRow> | "id" | "user_id" | "measured_at" | "created_at">;
      meals: TableDef<MealRow, Nullable<MealRow> | "id" | "user_id" | "eaten_at" | "source" | "created_at" | "updated_at">;
      workouts: TableDef<
        WorkoutRow,
        Nullable<WorkoutRow> | "id" | "user_id" | "started_at" | "duration_min" | "is_planned_rest" | "created_at" | "updated_at"
      >;
      workout_exercises: TableDef<
        WorkoutExerciseRow,
        "id" | "user_id" | "position" | "sets" | "created_at",
        [
          {
            foreignKeyName: "workout_exercises_workout_id_fkey";
            columns: ["workout_id"];
            isOneToOne: false;
            referencedRelation: "workouts";
            referencedColumns: ["id"];
          },
        ]
      >;
      body_measurements: TableDef<BodyMeasurementRow, Nullable<BodyMeasurementRow> | "id" | "user_id" | "measured_on" | "created_at">;
      progress_photos: TableDef<ProgressPhotoRow, Nullable<ProgressPhotoRow> | "id" | "user_id" | "taken_on" | "created_at">;
      daily_checkins: TableDef<DailyCheckinRow, Nullable<DailyCheckinRow> | "id" | "user_id" | "created_at" | "updated_at">;
      xp_rules: TableDef<XpRuleRow, never>;
      xp_events: TableDef<XpEventRow, Nullable<XpEventRow> | "id" | "created_at">;
      achievements: TableDef<AchievementRow, "id" | "unlocked_at">;
      coach_messages: TableDef<CoachMessageRow, "id" | "user_id" | "created_at">;
    };
    Views: { [_ in never]: never };
    Functions: {
      award_xp: {
        Args: { p_action: string; p_occurred_on: string; p_source_id?: string | null };
        Returns: number;
      };
      check_consistency_week: { Args: { p_today: string }; Returns: number };
      refresh_achievements: { Args: Record<string, never>; Returns: string[] };
      export_my_data: { Args: Record<string, never>; Returns: Json };
      delete_my_data: { Args: Record<string, never>; Returns: undefined };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
