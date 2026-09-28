import { fitLabel, lifestyleLabel, presetLabels } from "./content";
import { useGo, useLab } from "./context";
import { Primary, Quiet, Secondary } from "./controls";
import Frame from "./Frame";
import Signature from "./Signature";
import Stage from "./Stage";

function capitalise(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function joinNatural(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** The saved DNA, in plain words, with the signature expanded under his frame. */
export default function You() {
  const { store, journey, portraitSrc } = useLab();
  const go = useGo();
  const dna = store.dna;

  const forget = () => {
    store.reset();
    journey.clearAll();
    go("");
  };

  const frame = (
    <>
      <Frame image={portraitSrc} alt={journey.journey.portrait?.kind === "captured" || dna?.portrait ? "You" : "The stand-in"} />
      {dna && <Signature tones={dna.tones} answers={{ fit: dna.fit, lifestyle: dna.lifestyle, presetIds: dna.presetIds }} />}
    </>
  );

  if (!dna) {
    return (
      <Stage
        frame={frame}
        rail={
          <>
            <h1 className="text-[18px] font-medium">No signature yet.</h1>
            <p className="max-w-[34ch] text-[16px] text-[var(--muted)]">Your tones, fit and week, read once and kept under the frame. Next time, one tap gets you dressed.</p>
            <Primary onClick={() => go("dna/face")}>Build my Style DNA</Primary>
          </>
        }
      />
    );
  }

  const strong = dna.tones.contrast === "high" ? "strong" : dna.tones.contrast === "low" ? "soft" : "medium";
  const details = [fitLabel(dna.fit), lifestyleLabel(dna.lifestyle)?.toLowerCase()].filter((d): d is string => Boolean(d));
  const presets = presetLabels(dna.presetIds).map((l) => l.toLowerCase());
  // The tone line opens by restating undertone and contrast; the heading already says that.
  const advice = dna.tones.line.includes(". ") ? dna.tones.line.slice(dna.tones.line.indexOf(". ") + 2) : dna.tones.line;

  return (
    <Stage
      frame={frame}
      rail={
        <>
          <h1 className="text-[18px] font-medium">
            {capitalise(dna.tones.undertone)} undertone, {strong} contrast.
          </h1>
          <div className="flex items-center gap-4" aria-label="Your palette">
            <div className="flex gap-1.5" role="img" aria-label={`Palette of ${dna.tones.palette.length} colours`}>
              {dna.tones.palette.map((hex) => (
                <span key={hex} className="c-swatch h-8 w-10" style={{ backgroundColor: hex }} />
              ))}
            </div>
            <div className="flex items-center gap-1.5" role="img" aria-label="Colours to avoid">
              <span className="text-[14px] text-[var(--muted)]">Avoid</span>
              {dna.tones.avoid.map((hex) => (
                <span key={hex} className="c-swatch h-5 w-5" style={{ backgroundColor: hex }} />
              ))}
            </div>
          </div>
          <p className="max-w-[38ch] text-[16px]">{advice}</p>
          {(details.length > 0 || presets.length > 0) && (
            <p className="max-w-[38ch] text-[14px] text-[var(--muted)]">
              {details.length > 0 && `${capitalise(details.join(", "))}.`}
              {presets.length > 0 && ` Inspired by ${joinNatural(presets)}.`}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Primary onClick={() => go("")}>Style a moment</Primary>
            <Secondary onClick={() => go("dna/face")}>Redo</Secondary>
            <Quiet onClick={forget}>Forget me</Quiet>
          </div>
        </>
      }
    />
  );
}
