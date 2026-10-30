"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useField } from "./ActionForm";

const inputClasses =
  "min-h-11 w-full rounded-xl border bg-night-900 px-3 text-[0.95rem] text-ink placeholder:text-ink-faint transition-colors focus:border-teal-500/70 focus:outline-none";

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

function FieldShell({ id, label, hint, error, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink-soft">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-ember-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface TextFieldProps {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string | number | null;
  type?: "text" | "email" | "password" | "date" | "datetime-local";
  inputMode?: "text" | "decimal" | "numeric" | "email";
  placeholder?: string;
  autoComplete?: string;
  suffix?: string;
  required?: boolean;
  maxLength?: number;
}

export function TextField({
  name,
  label,
  hint,
  defaultValue,
  type = "text",
  inputMode,
  placeholder,
  autoComplete,
  suffix,
  required,
  maxLength,
}: TextFieldProps) {
  const id = useId();
  const { error, value } = useField(name);
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={type}
          inputMode={inputMode}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          maxLength={maxLength}
          defaultValue={value ?? (defaultValue === null || defaultValue === undefined ? undefined : String(defaultValue))}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(inputClasses, error ? "border-ember-400/70" : "border-line-strong", suffix && "pr-12")}
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-sm text-ink-muted">
            {suffix}
          </span>
        ) : null}
      </div>
    </FieldShell>
  );
}

/** Champ numérique adapté au clavier mobile ; accepte la virgule décimale. */
export function NumberField(props: Omit<TextFieldProps, "type" | "inputMode"> & { integer?: boolean }) {
  const { integer, ...rest } = props;
  return <TextField {...rest} type="text" inputMode={integer ? "numeric" : "decimal"} autoComplete="off" />;
}

interface TextAreaFieldProps {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string | null;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
}

export function TextAreaField({ name, label, hint, defaultValue, rows = 3, maxLength, placeholder }: TextAreaFieldProps) {
  const id = useId();
  const { error, value } = useField(name);
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <textarea
        id={id}
        name={name}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        defaultValue={value ?? defaultValue ?? undefined}
        aria-invalid={error ? true : undefined}
        className={cn(inputClasses, "py-2.5 leading-relaxed", error ? "border-ember-400/70" : "border-line-strong")}
      />
    </FieldShell>
  );
}

interface SelectFieldProps {
  name: string;
  label: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  defaultValue?: string;
  hint?: string;
}

export function SelectField({ name, label, options, defaultValue, hint }: SelectFieldProps) {
  const id = useId();
  const { error, value } = useField(name);
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <select
        id={id}
        name={name}
        defaultValue={value ?? defaultValue}
        aria-invalid={error ? true : undefined}
        className={cn(inputClasses, "appearance-none", error ? "border-ember-400/70" : "border-line-strong")}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

interface ChoiceFieldProps {
  name: string;
  label: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  defaultValue?: string | number | null;
  hint?: string;
  columns?: number;
  onValueChange?: (value: string) => void;
}

/** Choix exclusif sous forme de segments tactiles (échelles 1–5, types, poses…). */
export function ChoiceField({ name, label, options, defaultValue, hint, columns, onValueChange }: ChoiceFieldProps) {
  const id = useId();
  const { error, value } = useField(name);
  const selected = value ?? (defaultValue === null || defaultValue === undefined ? undefined : String(defaultValue));
  return (
    <fieldset className="flex flex-col gap-1.5" aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}>
      <legend className="mb-1.5 text-sm font-medium text-ink-soft">{label}</legend>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }}>
        {options.map((o) => (
          <label key={o.value} className="relative">
            <input
              type="radio"
              name={name}
              value={o.value}
              defaultChecked={selected === o.value}
              onChange={onValueChange ? () => onValueChange(o.value) : undefined}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-line-strong bg-night-900 px-1 text-center text-sm font-semibold text-ink-muted transition-colors",
                "peer-checked:border-teal-400/70 peer-checked:bg-teal-500/15 peer-checked:text-teal-200",
                "peer-focus-visible:outline-2 peer-focus-visible:outline-teal-400",
              )}
            >
              {o.label}
            </span>
          </label>
        ))}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-ember-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </fieldset>
  );
}

export const SCALE_1_TO_5 = ["1", "2", "3", "4", "5"].map((v) => ({ value: v, label: v }));

export function FieldRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}
