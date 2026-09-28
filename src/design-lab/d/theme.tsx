/** Mode controls: a two-option radiogroup for the You drawer and one lab-only 44 px button in the corner. */
import type { ModeId } from "./useMode";

interface Props {
  mode: ModeId;
  onMode: (m: ModeId) => void;
}

export function ModeRadio({ mode, onMode }: Props) {
  return (
    <div role="radiogroup" aria-label="Appearance" className="flex gap-2">
      {(["light", "dark"] as const).map((m) => (
        <button key={m} type="button" role="radio" aria-checked={mode === m} className="d-control" onClick={() => onMode(m)}>
          {m === "light" ? "Light" : "Dark"}
        </button>
      ))}
    </div>
  );
}

export function ModeButton({ mode, onMode }: Props) {
  const next: ModeId = mode === "dark" ? "light" : "dark";
  return (
    <button type="button" className="d-control d-secondary d-mode-button" aria-label={`Switch to ${next} mode`} onClick={() => onMode(next)}>
      {mode === "dark" ? "Dark" : "Light"}
    </button>
  );
}
