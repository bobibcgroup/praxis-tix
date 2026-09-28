import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useConceptFonts } from "../shared/fonts";
import { BRANDS, SYSTEMS, paletteVars, type Brand, type BrandId, type Mode, type SystemId } from "./brands";
import { SystemSpecimens } from "./Specimens";
import "./system.css";

const FONTS =
  "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@500;600&family=Geist:wght@400;500&family=Geist+Mono:wght@400&family=Cormorant+Garamond:wght@400;500&family=Source+Serif+4:opsz,wght@8..60,600&family=Bricolage+Grotesque:wght@500;600&family=Manrope:wght@400;500&display=swap";

function readParam<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function Toggle<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<{ id: T; name: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-1">
      <span className="mr-2 text-[13px]" style={{ color: "var(--muted)" }}>
        {label}
      </span>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          className="sys-control"
          style={{ height: 36, "--inset": "12px" } as React.CSSProperties}
          onClick={() => onChange(o.id)}
        >
          {o.name}
        </button>
      ))}
    </div>
  );
}

function BrandCard({ brand, mode, active, onPick }: { brand: Brand; mode: Mode; active: boolean; onPick: () => void }) {
  const p = brand[mode];
  const vars = {
    ...paletteVars(p),
    "--font-display": brand.display,
    "--font-display-weight": String(brand.displayWeight),
    "--font-display-tracking": brand.displayTracking,
    "--font-body": brand.body,
    "--font-mono": brand.mono,
  } as React.CSSProperties;
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={active}
      className="block w-full text-left outline-none"
      style={{
        ...vars,
        background: p.bg,
        color: p.text,
        fontFamily: p ? brand.body : undefined,
        border: `1px solid ${active ? p.accent : p.rule}`,
        boxShadow: active ? `0 0 0 1px ${p.accent}` : "none",
        borderRadius: "var(--r-frame, 2px)",
      }}
    >
      <div className="p-6">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px]" style={{ color: p.muted }}>
            Direction {BRANDS.indexOf(brand) + 1}
          </span>
          <span className="text-[13px]" style={{ color: active ? p.accent : p.muted }}>
            {active ? "Viewing" : "View"}
          </span>
        </div>
        <h3 className="sys-display mt-3 text-[34px]" style={{ fontFamily: brand.display, fontWeight: brand.displayWeight, letterSpacing: brand.displayTracking }}>
          {brand.name}
        </h3>
        <p className="mt-2 max-w-[42ch] text-[15px]">{brand.mood}</p>
        <div className="mt-5 grid grid-cols-5 gap-2">
          {brand.swatches.map((s) => (
            <div key={s.role}>
              <div className="sys-swatch" style={{ background: p[s.key], borderColor: `color-mix(in srgb, ${p.text} 12%, transparent)` }} />
              <div className="mt-2 text-[12px]" style={{ color: p.muted }}>
                {s.role}
              </div>
              <div className="sys-mono text-[11px]" style={{ color: p.muted, fontFamily: brand.mono }}>
                {p[s.key]}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span
            className="inline-flex h-11 items-center px-5 text-[15px] font-medium"
            style={{ background: p.accent, color: p.accentFg, borderRadius: "var(--r-control, 2px)" }}
          >
            Build the looks
          </span>
          <span
            className="inline-flex h-11 items-center px-4 text-[15px] font-medium"
            style={{ border: `1px solid ${p.rule}`, borderRadius: "var(--r-control, 2px)" }}
          >
            Sharp <span className="ml-2 text-[13px] font-normal" style={{ color: p.muted }}>Make an impression</span>
          </span>
        </div>
        <p className="mt-5 text-[13px]" style={{ color: p.muted }}>
          {brand.words.join(" · ")}
        </p>
      </div>
    </button>
  );
}

export default function SystemLab() {
  useConceptFonts("system", FONTS);
  const [params, setParams] = useSearchParams();
  const brandId = readParam<BrandId>(params.get("brand"), BRANDS.map((b) => b.id), "chalk");
  const systemId = readParam<SystemId>(params.get("system"), SYSTEMS.map((s) => s.id), "hairline");
  const mode = readParam<Mode>(params.get("mode"), ["light", "dark"], "light");
  const [gridOn, setGridOn] = useState(false);

  const brand = BRANDS.find((b) => b.id === brandId) ?? BRANDS[0];
  const system = SYSTEMS.find((s) => s.id === systemId) ?? SYSTEMS[0];

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    next.set(key, value);
    setParams(next, { replace: true });
  };

  const rootVars = useMemo(
    () =>
      ({
        ...paletteVars(brand[mode]),
        "--font-display": brand.display,
        "--font-display-weight": String(brand.displayWeight),
        "--font-display-tracking": brand.displayTracking,
        "--font-body": brand.body,
        "--font-mono": brand.mono,
        ...system.vars,
        colorScheme: mode,
      }) as React.CSSProperties,
    [brand, mode, system],
  );

  useEffect(() => {
    document.title = "Praxis design system lab";
  }, []);

  return (
    <main data-lab="system" data-brand={brand.id} data-system={system.id} data-mode={mode} style={rootVars} className="min-h-[100dvh]">
      <header className="sticky top-0 z-10 border-b px-6 py-3" style={{ background: "var(--bg)", borderColor: "var(--rule)" }}>
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-8 gap-y-3">
          <span className="sys-display text-[20px]">Praxis</span>
          <Toggle label="Brand" value={brand.id} options={BRANDS.map((b) => ({ id: b.id, name: b.name.split(" ")[0] }))} onChange={(v) => set("brand", v)} />
          <Toggle label="Elements" value={system.id} options={SYSTEMS.map((s) => ({ id: s.id, name: s.name }))} onChange={(v) => set("system", v)} />
          <Toggle label="Mode" value={mode} options={[{ id: "light", name: "Light" }, { id: "dark", name: "Dark" }] as const} onChange={(v) => set("mode", v)} />
          <label className="ml-auto flex items-center gap-2 text-[13px]" style={{ color: "var(--muted)" }}>
            <input type="checkbox" checked={gridOn} onChange={(e) => setGridOn(e.target.checked)} className="h-4 w-4" />
            8 px grid
          </label>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] px-6 pb-24">
        <section className="pt-12">
          <h2 className="sys-display text-[40px]">Three brand directions</h2>
          <p className="mt-3 max-w-[64ch] text-[16px]" style={{ color: "var(--muted)" }}>
            Palette, type and mood. Tap one to view the element systems below in that brand. Mode applies to all three.
          </p>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {BRANDS.map((b) => (
              <BrandCard key={b.id} brand={b} mode={mode} active={b.id === brand.id} onPick={() => set("brand", b.id)} />
            ))}
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {BRANDS.map((b) => (
              <p key={b.id} className="text-[14px]" style={{ color: "var(--muted)" }}>
                <span style={{ color: "var(--text)" }}>{b.name}.</span> {b.why}
              </p>
            ))}
          </div>
        </section>

        <section className="pt-16">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="sys-display text-[40px]">Three element systems</h2>
            <p className="max-w-[56ch] text-[15px]" style={{ color: "var(--muted)" }}>
              Buttons, choices, brief lines, progress, thumbnails and detail rows, built to the rules listed under each. All controls are 44 px; text is centred by the box.
            </p>
          </div>
          <div className="mt-10 grid gap-16">
            {SYSTEMS.map((s) => (
              <div key={s.id} className="border-t pt-8" style={{ borderColor: "var(--rule)" }}>
                <div className="mb-2 flex items-center gap-3 text-[13px]" style={{ color: "var(--muted)" }}>
                  <span>System {SYSTEMS.indexOf(s) + 1}</span>
                  {s.id === system.id ? (
                    <span style={{ color: "var(--accent)" }}>Shown in the frame below</span>
                  ) : (
                    <button type="button" className="underline underline-offset-4" onClick={() => set("system", s.id)}>
                      Show in the frame
                    </button>
                  )}
                </div>
                <SystemSpecimens system={s} gridOn={gridOn} />
              </div>
            ))}
          </div>
        </section>

        <section className="pt-16">
          <h2 className="sys-display text-[40px]">In the frame</h2>
          <p className="mt-3 max-w-[64ch] text-[16px]" style={{ color: "var(--muted)" }}>
            The chosen brand and element system on a results composition, so alignment can be judged where it matters.
          </p>
          <div className="mt-8 grid items-start gap-10 lg:grid-cols-[2fr_3fr]">
            <div>
              <div className="sys-line">
                <span className="label">For</span>
                <span className="value">Dinner</span>
              </div>
              <div className="sys-line">
                <span className="label">Where</span>
                <span className="value">Bar</span>
              </div>
              <div className="sys-line">
                <span className="label">When</span>
                <span className="value">Night</span>
              </div>
              <div className="sys-line">
                <span className="label">Feel</span>
                <span className="value">Sharp</span>
              </div>
              <div className="sys-line">
                <span className="label">Spend</span>
                <span className="value">Elevated</span>
              </div>
              <p className="mt-8 text-[13px]" style={{ color: "var(--muted)" }}>
                Sharper for dinner
              </p>
              <h3 className="sys-display mt-1 text-[34px]">Elevated Dinner</h3>
              <p className="mt-2 max-w-[44ch] text-[16px]">One stronger contrast at the face. That is what people remember.</p>
              <div className="mt-6" style={{ maxWidth: 360 }}>
                <div className="sys-row">
                  <span>
                    Blazer over a fitted knit<span className="vendor">Studio Oren</span>
                  </span>
                  <span className="sys-num">$220</span>
                </div>
                <div className="sys-row">
                  <span>
                    Tailored trousers<span className="vendor">Harbour &amp; Finch</span>
                  </span>
                  <span className="sys-num">$240</span>
                </div>
                <div className="sys-row">
                  <span>
                    Chelsea boots<span className="vendor">Studio Oren</span>
                  </span>
                  <span className="sys-num">$420</span>
                </div>
                <div className="sys-total">
                  <span>Total</span>
                  <span className="sys-num">$880</span>
                </div>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button type="button" className="sys-control sys-primary">
                  See it on you
                </button>
                <button type="button" className="sys-control sys-tertiary">
                  Save
                </button>
                <button type="button" className="sys-control sys-tertiary">
                  Share
                </button>
              </div>
            </div>
            <div>
              <div className="sys-frame mx-auto" style={{ width: "min(100%, 420px)", aspectRatio: "3 / 4" }}>
                <img src="/images/dinner_sharper_01.jpg" alt="Elevated Dinner look" />
              </div>
              <div className="mx-auto mt-4 flex justify-center">
                <SystemThumbsInline />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function SystemThumbsInline() {
  const [active, setActive] = useState(1);
  const srcs = ["/images/dinner_safest_01.jpg", "/images/dinner_sharper_01.jpg", "/images/dinner_relaxed_01.jpg"];
  return (
    <div className="sys-thumbs">
      {srcs.map((src, i) => (
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
  );
}
