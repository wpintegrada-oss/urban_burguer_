import type { ReactNode } from "react";

export const inputCls =
  "w-full rounded-xl border border-line bg-chip px-4 py-3 text-sm outline-none placeholder:text-muted/70 focus:border-brand";

export function Field({
  label,
  id,
  hint,
  children,
}: {
  label: string;
  id: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-muted">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** Interruptor ligar/desligar. */
export function Toggle({
  checked,
  onChange,
  label,
  disabled,
  testId,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
  testId?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      data-testid={testId}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
        checked ? "bg-emerald-500" : "bg-zinc-600"
      }`}
    >
      <span
        className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

/** 12.5 → "12,5" para mostrar em campos de texto. */
export const moneyToInput = (n: number | null | undefined): string =>
  n === null || n === undefined ? "" : String(n).replace(".", ",");

export function Pill({ children, tone }: { children: ReactNode; tone: "green" | "gray" | "orange" | "red" }) {
  const tones = {
    green: "bg-emerald-500/15 text-emerald-300",
    gray: "bg-zinc-600/40 text-zinc-300",
    orange: "bg-brand/15 text-brand-soft",
    red: "bg-red-500/15 text-red-300",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${tones[tone]}`}>{children}</span>;
}
