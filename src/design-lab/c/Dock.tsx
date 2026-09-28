import { Bookmark, CircleUser, ScanFace } from "lucide-react";
import { Link } from "react-router-dom";
import { useLab, useRelativePath } from "./context";

const ITEMS = [
  { id: "mirror", label: "Mirror", path: "", Icon: ScanFace },
  { id: "looks", label: "Looks", path: "looks", Icon: Bookmark },
  { id: "you", label: "You", path: "you", Icon: CircleUser },
] as const;

function activeId(rel: string): (typeof ITEMS)[number]["id"] {
  const head = rel.split("/")[0];
  if (head === "looks") return "looks";
  if (head === "you" || head === "dna") return "you";
  return "mirror";
}

/** Three items, nothing else. Bottom on mobile, bottom-left on desktop. */
export default function Dock() {
  const { base } = useLab();
  const rel = useRelativePath();
  const active = activeId(rel);

  return (
    <nav aria-label="Sections" className="c-dock">
      {ITEMS.map(({ id, label, path, Icon }) => {
        const current = id === active;
        return (
          <Link
            key={id}
            to={path ? `${base}/${path}` : base}
            aria-current={current ? "page" : undefined}
            className={`flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 lg:flex-none lg:flex-row lg:justify-start lg:gap-2.5 lg:px-2 ${
              current ? "text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
            <span className="text-[13px] font-medium lg:text-[14px]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
