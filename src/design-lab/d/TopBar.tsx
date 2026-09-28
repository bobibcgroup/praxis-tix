/** The only chrome: the wordmark and two quiet text links. The brief is the navigation. */
interface Props {
  savedCount: number;
  showNew: boolean;
  onNew: () => void;
  onLooks: () => void;
  onYou: () => void;
  onHome: () => void;
}

export function TopBar({ savedCount, showNew, onNew, onLooks, onYou, onHome }: Props) {
  return (
    <header className="d-max flex h-14 items-center justify-between pl-5 pr-3 lg:pl-12 lg:pr-10">
      <button type="button" onClick={onHome} className="d-display flex h-11 items-center text-[24px] leading-none text-[var(--text)] lg:text-[24px]" aria-label="Praxis, new brief">
        Praxis
      </button>
      <nav aria-label="Sections" className="flex items-center">
        {showNew ? (
          <button type="button" onClick={onNew} className="d-control d-tertiary text-[13px]">
            New moment
          </button>
        ) : null}
        <button type="button" onClick={onLooks} className="d-control d-tertiary gap-2 text-[13px]">
          Looks
          {savedCount > 0 ? <span className="d-num text-[12px]">{savedCount}</span> : null}
        </button>
        <button type="button" onClick={onYou} className="d-control d-tertiary text-[13px]">
          You
        </button>
      </nav>
    </header>
  );
}
