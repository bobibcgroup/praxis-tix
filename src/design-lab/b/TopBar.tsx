import { Link } from "react-router-dom";
import { BASE } from "./model";

interface Props {
  savedCount: number;
  onLooks: () => void;
  onYou: () => void;
}

/** The only navigation: a wordmark and two quiet text links. */
export function TopBar({ savedCount, onLooks, onYou }: Props) {
  return (
    <header className="flex h-11 shrink-0 items-center justify-between lg:h-10">
      <Link to={BASE} className="text-[13px] font-medium leading-none tracking-[0.02em]">
        Praxis
      </Link>
      <nav aria-label="Looks and you" className="-mr-2 flex items-center gap-2">
        <button type="button" onClick={onLooks} className="flex h-11 items-center px-2 text-[13px] leading-none transition-colors duration-150 hover:text-[var(--accent)] lg:h-8">
          Looks
          {savedCount > 0 ? <span className="b-mono ml-1.5 text-[12px] text-[var(--muted)]">{savedCount}</span> : null}
        </button>
        <button type="button" onClick={onYou} className="flex h-11 items-center px-2 text-[13px] leading-none transition-colors duration-150 hover:text-[var(--accent)] lg:h-8">
          You
        </button>
      </nav>
    </header>
  );
}
