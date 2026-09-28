import type { CSSProperties } from "react";

interface Props<T extends string> {
  name: string;
  options: readonly { id: T; label: string; hint?: string }[];
  value: T | null;
  onChange: (id: T) => void;
}

/** Labels this short share a phone row three across; longer ones (the venues) sit two across. */
const SHORT_LABEL = 8;

/** Inline options for one brief line: a radiogroup of 44 px controls; label and hint on one baseline. */
export function Chips<T extends string>({ name, options, value, onChange }: Props<T>) {
  const cols = options.every((o) => o.label.length <= SHORT_LABEL) ? 3 : 2;
  const style = { "--chip-cols": cols } as CSSProperties;
  return (
    <div role="radiogroup" aria-label={name} className="chips" style={style}>
      {options.map((option) => (
        <button key={option.id} type="button" role="radio" aria-checked={value === option.id} className="d-control" onClick={() => onChange(option.id)}>
          {option.label}
          {option.hint ? <span className="hint hidden sm:inline">{option.hint}</span> : null}
        </button>
      ))}
    </div>
  );
}
