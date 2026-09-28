import type { ChoiceOption } from "../shared/catalog";

interface Props<T extends string> {
  name: string;
  options: readonly ChoiceOption<T>[];
  value: T | null;
  onChange: (id: T) => void;
}

/** Inline options for one brief line. A radiogroup of chips; selected is ink-filled. */
export function Chips<T extends string>({ name, options, value, onChange }: Props<T>) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={value === option.id}
          onClick={() => onChange(option.id)}
          className="b-chip transition-colors duration-150"
        >
          <span className="text-[15px] leading-5">{option.label}</span>
          {option.hint ? <span className="b-hint text-[12px] leading-4 text-[var(--muted)]">{option.hint}</span> : null}
        </button>
      ))}
    </div>
  );
}
