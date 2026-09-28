import { motion, useReducedMotion } from "motion/react";
import { STAND_IN_PORTRAIT, type Look } from "../shared/catalog";
import { TRYON_STAGES } from "../shared/guided";
import { HeroFrame } from "./HeroFrame";
import { PiecesTable } from "./PiecesTable";
import { StageLines } from "./StageLines";
import { useTryOn } from "./tryon";
import { formatPrice } from "./model";
import { PrimaryButton, TextButton } from "./ui";
import type { BriefController } from "./useBrief";

export type ResultLayout = "full" | "tablet" | "compact";

interface Props {
  c: BriefController;
  layout: ResultLayout;
}

/** Hero frame per layout: 4:5 everywhere; tablet is 40% of the sheet, capped at 60dvh. */
const HERO_FRAME: Record<ResultLayout, string> = {
  full: "h-[min(52dvh,460px)] w-auto aspect-[4/5]",
  tablet: "w-full aspect-[4/5] max-h-[60dvh]",
  compact: "h-[220px] w-[176px]",
};

interface AlternateProps {
  look: Look;
  delay: number;
  compact: boolean;
  onSwap: () => void;
}

function Alternate({ look, delay, compact, onSwap }: AlternateProps) {
  const reduced = useReducedMotion();
  const frame = compact ? "h-[128px] w-[96px]" : "h-[144px] w-[108px]";
  return (
    <motion.button
      type="button"
      onClick={onSwap}
      aria-label={`Make ${look.title} the hero`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.28, delay: reduced ? 0 : delay, ease: "easeOut" }}
      className="group flex min-w-0 items-start gap-4 rounded-[6px] text-left"
    >
      <span className={`b-frame ${frame} shrink-0`}>
        <img src={look.image} alt="" className="h-full w-full object-cover" />
      </span>
      <span className="min-w-0 flex-1 pt-1">
        <span className="block text-[15px] font-medium leading-5">{look.title}</span>
        <span className="mt-1 block text-[13px] leading-snug text-[var(--muted)]">{look.why}</span>
        <span className="b-mono mt-2 block text-[13px] leading-none">{formatPrice(look.total)}</span>
        <span className="mt-3 inline-block text-[13px] leading-none text-[var(--muted)] underline decoration-[var(--rule)] underline-offset-4 transition-colors duration-150 group-hover:text-[var(--ink)] group-hover:decoration-[var(--ink)]">
          Swap in
        </span>
      </span>
    </motion.button>
  );
}

/** The result: hero at large with its why, pieces and actions; two alternates beneath. */
export function LookResult({ c, layout }: Props) {
  const reduced = useReducedMotion() ?? false;
  const compact = layout === "compact";
  const [hero, ...alternates] = c.looks;
  const portrait = c.face?.image ?? STAND_IN_PORTRAIT;
  const { build, rendered } = useTryOn(c.tryon, reduced);
  const dim = c.phase === "rebuilding";
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduced ? 0 : 0.28, delay: reduced ? 0 : delay, ease: "easeOut" as const },
  });

  const actions =
    c.tryon && !rendered ? (
      <StageLines stages={TRYON_STAGES} index={build.index} label="Rendering the look on you" />
    ) : c.tryon ? (
      <div className="flex flex-col items-start gap-3">
        <PrimaryButton onClick={() => c.openDrawer("buy")}>Buy the pieces</PrimaryButton>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <TextButton onClick={() => c.save(portrait)}>{c.savedHero ? "Saved" : "Save"}</TextButton>
          <TextButton onClick={() => c.openDrawer("share")}>Share</TextButton>
          <TextButton onClick={() => c.setTryon(false)}>Back to looks</TextButton>
        </div>
      </div>
    ) : (
      <div className="flex flex-col items-start gap-3">
        <PrimaryButton onClick={() => c.setTryon(true)}>See it on you</PrimaryButton>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <TextButton onClick={() => c.save()}>{c.savedHero ? "Saved" : "Save"}</TextButton>
          <TextButton onClick={() => c.openDrawer("buy")}>Buy the pieces</TextButton>
          <TextButton onClick={() => c.openDrawer("share")}>Share</TextButton>
        </div>
      </div>
    );

  return (
    <motion.div
      animate={{ opacity: dim ? 0.6 : 1 }}
      transition={{ duration: reduced ? 0 : 0.2, ease: "easeOut" }}
      aria-busy={dim}
      className="flex min-h-0 flex-col"
    >
      <div className={compact ? "flex gap-4" : "flex gap-8"}>
        <motion.div {...rise(0)} className={layout === "tablet" ? "w-[40%] shrink-0" : undefined}>
          <HeroFrame look={hero} occasion={c.occasion} portrait={portrait} rendered={rendered} frameClass={HERO_FRAME[layout]} />
        </motion.div>
        <motion.div {...rise(0.12)} className="flex min-w-0 flex-1 flex-col">
          <h2 className="text-[20px] font-medium leading-tight">{hero.title}</h2>
          <p className="mt-1 text-[15px] leading-snug text-[var(--muted)]">{hero.why}</p>
          {compact ? (
            <p className="b-mono mt-3 text-[15px] leading-none">{formatPrice(hero.total)}</p>
          ) : (
            <>
              <PiecesTable pieces={hero.pieces} total={hero.total} />
              <div className="mt-5">{actions}</div>
            </>
          )}
        </motion.div>
      </div>

      {compact ? (
        <motion.div {...rise(0.12)}>
          <div className="mt-5">{actions}</div>
          <PiecesTable pieces={hero.pieces} total={hero.total} compact />
        </motion.div>
      ) : null}

      <div className={compact ? "mt-5 flex flex-col gap-5" : "mt-6 grid grid-cols-2 gap-6 border-t border-[var(--rule)] pt-5"}>
        {alternates.map((look, i) => (
          <Alternate key={look.id} look={look} delay={0.24 + i * 0.12} compact={compact} onSwap={() => c.swapHero(look.id)} />
        ))}
      </div>
    </motion.div>
  );
}
