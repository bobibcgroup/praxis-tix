import { useState } from "react";
import type { ElementSystem } from "./brands";

const THUMBS = ["/images/dinner_safest_01.jpg", "/images/dinner_sharper_01.jpg", "/images/dinner_relaxed_01.jpg"];

function Chevron() {
  return (
    <svg className="chev" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Heading({ children, note }: { children: string; note: string }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-6">
      <h4 className="flex-none whitespace-nowrap text-[13px] font-medium">{children}</h4>
      <span className="text-right text-[13px]" style={{ color: "var(--muted)" }}>
        {note}
      </span>
    </div>
  );
}

function Buttons() {
  return (
    <div>
      <Heading note="44 px tall. Primary is filled accent, secondary outlined, tertiary is text.">Buttons</Heading>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="sys-control sys-primary">
          See it on you
        </button>
        <button type="button" className="sys-control sys-secondary">
          Save
        </button>
        <button type="button" className="sys-control sys-tertiary">
          Share
        </button>
        <button type="button" className="sys-control sys-primary" disabled>
          Build the looks
        </button>
      </div>
    </div>
  );
}

function Choices() {
  const [picked, setPicked] = useState("SHARP");
  const options = [
    { id: "SAFE", label: "Safe", hint: "Always appropriate" },
    { id: "SHARP", label: "Sharp", hint: "Make an impression" },
    { id: "RELAXED", label: "Relaxed", hint: "Easy, still put together" },
  ];
  return (
    <div>
      <Heading note="Label and hint on one baseline, 8 px apart. Tap to change the selection.">Choices</Heading>
      <div role="radiogroup" aria-label="Feel" className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={picked === o.id}
            className="sys-control"
            onClick={() => setPicked(o.id)}
          >
            {o.label}
            <span className="hint">{o.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function BriefLines() {
  return (
    <div>
      <Heading note="96 px label column, 52 px rows, chevron in a 24 px column. Values share the label's left edge.">Brief lines</Heading>
      <div>
        <div className="sys-line">
          <span className="label">For</span>
          <span className="value">Dinner</span>
          <Chevron />
        </div>
        <div className="sys-line">
          <span className="label">Where</span>
          <span className="value">Bar</span>
          <Chevron />
        </div>
        <div className="sys-line" style={{ borderBottom: 0 }}>
          <span className="label">Feel</span>
          <span className="value empty">Choose</span>
          <Chevron />
        </div>
        <div className="sys-line-open">
          <div className="chips" role="radiogroup" aria-label="Feel">
            <button type="button" role="radio" aria-checked="false" className="sys-control">
              Safe
            </button>
            <button type="button" role="radio" aria-checked="true" className="sys-control">
              Sharp
            </button>
            <button type="button" role="radio" aria-checked="false" className="sys-control">
              Relaxed
            </button>
          </div>
        </div>
        <div className="sys-line">
          <span className="label">Spend</span>
          <span className="value empty">Choose</span>
          <Chevron />
        </div>
      </div>
    </div>
  );
}

function Progress({ system }: { system: ElementSystem }) {
  const done = 3;
  const total = 6;
  if (system.id === "hairline") {
    return (
      <div>
        <Heading note="Six 2 px segments, 4 px gaps, tabular count on the left.">Progress</Heading>
        <div className="sys-segments">
          <span className="sys-num text-[13px]" style={{ color: "var(--muted)" }}>
            3 of 6, Feel
          </span>
          <div className="track" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
              <span key={i} className={i < done ? "seg done" : "seg"} />
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (system.id === "soft") {
    const names = ["For", "Where", "When", "Feel", "Spend", "You"];
    return (
      <div>
        <Heading note="Numbered 24 px discs joined by a 1 px line. Done steps fill with accent.">Progress</Heading>
        <div className="sys-steps" aria-label="Step 4 of 6, Feel">
          {names.map((n, i) => (
            <span key={n} className="contents">
              <span className={i < done ? "disc done" : i === done ? "disc now" : "disc"} title={n}>
                {i + 1}
              </span>
              {i < names.length - 1 && <span className={i < done ? "join done" : "join"} />}
            </span>
          ))}
        </div>
      </div>
    );
  }
  const r = 17;
  const c = 2 * Math.PI * r;
  return (
    <div>
      <Heading note="40 px ring with the count inside, six dots beneath.">Progress</Heading>
      <div className="sys-ring">
        <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r={r} fill="none" stroke="var(--rule)" strokeWidth="2" />
          <circle
            cx="20"
            cy="20"
            r={r}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - done / total)}
            transform="rotate(-90 20 20)"
          />
          <text x="20" y="20" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="500" fill="var(--text)" className="sys-num">
            {done}
          </text>
        </svg>
        <span className="text-[13px]" style={{ color: "var(--muted)" }}>
          Feel
        </span>
      </div>
      <div className="sys-dots" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <i key={i} className={i < done ? "done" : ""} />
        ))}
      </div>
    </div>
  );
}

function Thumbs() {
  const [active, setActive] = useState(1);
  return (
    <div>
      <Heading note="Three prints stay in order; the active one is marked. Tap to move the mark.">Thumbnails</Heading>
      <div className="sys-thumbs">
        {THUMBS.map((src, i) => (
          <button
            key={src}
            type="button"
            className={i === active ? "sys-thumb is-active" : "sys-thumb"}
            aria-pressed={i === active}
            aria-label={`Look ${i + 1}`}
            onClick={() => setActive(i)}
          >
            <img src={src} alt="" />
          </button>
        ))}
      </div>
    </div>
  );
}

function Details() {
  const rows = [
    ["Blazer over a fitted knit", "Studio Oren", "$220"],
    ["Tailored trousers", "Harbour & Finch", "$240"],
    ["Chelsea boots", "Studio Oren", "$420"],
  ];
  return (
    <div>
      <Heading note="Prices are tabular figures on one right edge; vendor sits 2 px under the piece in 13 px grey.">Detail rows</Heading>
      <div style={{ maxWidth: 360 }}>
        {rows.map(([piece, vendor, price]) => (
          <div key={piece} className="sys-row">
            <span>
              {piece}
              <span className="vendor">{vendor}</span>
            </span>
            <span className="sys-num">{price}</span>
          </div>
        ))}
        <div className="sys-total">
          <span>Total</span>
          <span className="sys-num">$880</span>
        </div>
      </div>
    </div>
  );
}

export function SystemSpecimens({ system, gridOn }: { system: ElementSystem; gridOn: boolean }) {
  return (
    <div data-system={system.id} style={system.vars as React.CSSProperties}>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
        <h3 className="sys-display text-[26px]">{system.name}</h3>
        <p className="max-w-[60ch] text-[14px]" style={{ color: "var(--muted)" }}>
          {system.line}
        </p>
      </div>
      <div className={gridOn ? "sys-grid-on grid gap-x-16 gap-y-10 p-6 lg:grid-cols-2" : "grid gap-x-16 gap-y-10 p-6 lg:grid-cols-2"}>
        <Buttons />
        <Choices />
        <BriefLines />
        <div className="grid gap-10">
          <Progress system={system} />
          <Thumbs />
        </div>
        <Details />
        <ul className="grid gap-2 text-[13px]" style={{ color: "var(--muted)" }}>
          {system.rules.map((r) => (
            <li key={r} className="grid grid-cols-[12px_1fr] gap-2">
              <span aria-hidden="true">·</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
