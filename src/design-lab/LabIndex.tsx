import { Link } from "react-router-dom";

interface ConceptCard {
  id: "a" | "b" | "c" | "d" | "system";
  name: string;
  line: string;
}

const CONCEPTS: readonly ConceptCard[] = [
  { id: "system", name: "Brand and element systems", line: "Three brand directions and three element systems, any combination, light and dark." },
  { id: "d", name: "Atelier (final)", line: "A's living frame with B's visible brief, on one page. Three visual directions, light and dark." },
  { id: "a", name: "Stage", line: "One question per frame. The look assembles beside you as you answer." },
  { id: "b", name: "Brief", line: "A tailor's brief that fills itself in. Edit a line, the looks change." },
  { id: "c", name: "Mirror", line: "Your reflection is the interface. Outfits are rendered on you first." },
];

/** Internal index for the three redesign prototypes. Not linked from production. */
export default function LabIndex() {
  return (
    <main data-lab className="mx-auto flex min-h-[100dvh] max-w-3xl flex-col justify-center px-6 py-16 font-sans text-[#181d25]">
      <p className="text-sm text-[#6b7280]">Praxis design lab</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">Three directions</h1>
      <ul className="mt-10 divide-y divide-[#e5e3df]">
        {CONCEPTS.map((c) => (
          <li key={c.id}>
            <Link
              to={`/__design/${c.id}`}
              className="group flex items-baseline justify-between gap-6 py-6 outline-none focus-visible:ring-2 focus-visible:ring-[#395647]"
            >
              <span>
                <span className="text-xs uppercase tracking-[0.18em] text-[#6b7280]">Concept {c.id.toUpperCase()}</span>
                <span className="mt-1 block text-xl font-medium">{c.name}</span>
                <span className="mt-1 block max-w-[52ch] text-sm text-[#4b5563]">{c.line}</span>
              </span>
              <span className="text-sm text-[#395647] transition-transform group-hover:translate-x-1">Open</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
