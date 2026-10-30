"use client";

import { Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { FormState } from "@/lib/validation/form";
import { WORKOUT_KINDS, WORKOUT_KIND_LABELS } from "@/lib/validation/schemas";
import { ActionForm, useField } from "./ActionForm";
import { ChoiceField, FieldRow, NumberField, TextAreaField, TextField } from "./fields";
import { PhotoField } from "./PhotoField";

interface SetDraft {
  reps: string;
  load: string;
  duration: string;
}

interface ExerciseDraft {
  key: number;
  name: string;
  sets: SetDraft[];
}

const emptySet = (): SetDraft => ({ reps: "", load: "", duration: "" });

function toNumber(value: string): number | undefined {
  const cleaned = value.replace(",", ".").trim();
  if (cleaned === "") return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

/** Sérialise les exercices pour la Server Action (validés à nouveau côté serveur). */
function serialize(exercises: ExerciseDraft[]): string {
  return JSON.stringify(
    exercises
      .filter((e) => e.name.trim() !== "")
      .map((e) => ({
        name: e.name.trim(),
        sets: e.sets
          .map((s) => ({ reps: toNumber(s.reps), loadKg: toNumber(s.load), durationS: toNumber(s.duration) }))
          .filter((s) => s.reps !== undefined || s.durationS !== undefined),
      })),
  );
}

interface WorkoutFormProps {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  nowLocal: string;
  initialKind: (typeof WORKOUT_KINDS)[number];
  disabledReason?: string;
}

export function WorkoutForm({ action, nowLocal, initialKind, disabledReason }: WorkoutFormProps) {
  const [kind, setKind] = useState<string>(initialKind);
  const [exercises, setExercises] = useState<ExerciseDraft[]>([]);
  const [nextKey, setNextKey] = useState(1);
  const isRest = kind === "repos";

  function update(key: number, change: (e: ExerciseDraft) => ExerciseDraft) {
    setExercises((list) => list.map((e) => (e.key === key ? change(e) : e)));
  }

  function addExercise() {
    setExercises((list) => [...list, { key: nextKey, name: "", sets: [emptySet()] }]);
    setNextKey((k) => k + 1);
  }

  return (
    <ActionForm action={action} submitLabel={isRest ? "Valider le repos planifié" : "Enregistrer la séance"} disabledReason={disabledReason}>
      <ChoiceField
        name="kind"
        label="Type"
        columns={3}
        defaultValue={kind}
        onValueChange={setKind}
        options={WORKOUT_KINDS.map((k) => ({ value: k, label: k === "repos" ? "Repos" : WORKOUT_KIND_LABELS[k] }))}
      />

      {isRest ? (
        <>
          <input type="hidden" name="title" value="Repos planifié" />
          <input type="hidden" name="durationMin" value="0" />
          <p className="rounded-xl border border-violet-400/30 bg-violet-400/[0.07] px-3 py-2.5 text-sm leading-relaxed text-ink-soft">
            La récupération fait partie du programme : un repos planifié rapporte de l&apos;XP et compte dans ta régularité.
          </p>
        </>
      ) : (
        <>
          <TextField name="title" label="Intitulé" placeholder="MMA — technique & sparring" maxLength={120} required />
          <FieldRow>
            <NumberField name="durationMin" label="Durée" suffix="min" integer defaultValue={90} required />
            <NumberField name="perceivedEffort" label="Effort ressenti" suffix="/10" integer hint="1 facile · 10 maximal" />
          </FieldRow>
        </>
      )}

      <TextField name="startedAt" label="Date et heure" type="datetime-local" defaultValue={nowLocal} required />

      {isRest ? null : (
        <>
          <ExercisesEditor
            exercises={exercises}
            onAdd={addExercise}
            onRemove={(key) => setExercises((list) => list.filter((e) => e.key !== key))}
            onUpdate={update}
          />
          <input type="hidden" name="exercises" value={serialize(exercises)} />
          <PhotoField label="Photo de séance" />
        </>
      )}

      <TextAreaField name="note" label="Note" rows={2} maxLength={1000} placeholder="Sensations, douleurs, contexte…" />
    </ActionForm>
  );
}

interface ExercisesEditorProps {
  exercises: ExerciseDraft[];
  onAdd: () => void;
  onRemove: (key: number) => void;
  onUpdate: (key: number, change: (e: ExerciseDraft) => ExerciseDraft) => void;
}

const smallInput =
  "min-h-10 w-full rounded-lg border border-line-strong bg-night-900 px-2 text-sm text-ink placeholder:text-ink-faint focus:border-teal-500/70 focus:outline-none";

function ExercisesEditor({ exercises, onAdd, onRemove, onUpdate }: ExercisesEditorProps) {
  const { error } = useField("exercises");
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1.5 text-sm font-medium text-ink-soft">Exercices (facultatif)</legend>
      {exercises.map((ex, exIndex) => (
        <div key={ex.key} className="rounded-xl border border-line bg-night-900/50 p-3">
          <div className="flex items-center gap-2">
            <input
              aria-label={`Nom de l'exercice ${exIndex + 1}`}
              value={ex.name}
              onChange={(e) => {
                const name = e.currentTarget.value;
                onUpdate(ex.key, (x) => ({ ...x, name }));
              }}
              placeholder="Développé couché"
              maxLength={120}
              className={smallInput}
            />
            <button
              type="button"
              onClick={() => onRemove(ex.key)}
              aria-label={`Retirer l'exercice ${exIndex + 1}`}
              className="grid size-10 shrink-0 place-items-center rounded-lg text-ink-faint hover:text-ember-400"
            >
              <Trash2 aria-hidden className="size-4" />
            </button>
          </div>
          <div className="mt-2 grid grid-cols-[1.5rem_1fr_1fr_1fr_2rem] items-center gap-1.5 text-[0.65rem] uppercase tracking-wider text-ink-faint">
            <span>#</span>
            <span>Rép.</span>
            <span>Kg</span>
            <span>Sec.</span>
            <span />
          </div>
          {ex.sets.map((set, setIndex) => (
            <div key={setIndex} className="mt-1 grid grid-cols-[1.5rem_1fr_1fr_1fr_2rem] items-center gap-1.5">
              <span className="text-xs text-ink-muted tabular">{setIndex + 1}</span>
              {(["reps", "load", "duration"] as const).map((field) => (
                <input
                  key={field}
                  aria-label={`Série ${setIndex + 1}, ${field === "reps" ? "répétitions" : field === "load" ? "charge en kg" : "durée en secondes"}`}
                  inputMode={field === "load" ? "decimal" : "numeric"}
                  value={set[field]}
                  onChange={(e) => {
                    const value = e.currentTarget.value;
                    onUpdate(ex.key, (x) => ({
                      ...x,
                      sets: x.sets.map((s, i) => (i === setIndex ? { ...s, [field]: value } : s)),
                    }));
                  }}
                  className={smallInput}
                />
              ))}
              <button
                type="button"
                onClick={() => onUpdate(ex.key, (x) => ({ ...x, sets: x.sets.filter((_, i) => i !== setIndex) }))}
                aria-label={`Retirer la série ${setIndex + 1}`}
                className="grid size-8 place-items-center text-ink-faint hover:text-ember-400"
              >
                <X aria-hidden className="size-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onUpdate(ex.key, (x) => ({ ...x, sets: [...x.sets, x.sets.length > 0 ? { ...x.sets[x.sets.length - 1] } : emptySet()] }))
            }
            className="mt-2 text-xs font-semibold text-teal-300"
          >
            + Série
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong text-sm font-semibold text-ink-soft hover:border-teal-500/60"
      >
        <Plus aria-hidden className="size-4" /> Ajouter un exercice
      </button>
      {error ? <p className="text-xs font-medium text-ember-400">{error}</p> : null}
    </fieldset>
  );
}
