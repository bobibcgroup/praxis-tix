/**
 * What the print shows for the current state, and what sits under it:
 * the segmented hairline while the brief fills, the continuous one while a
 * build runs, the three thumbnails once looks exist, the try-on caption.
 */
import { useMemo, type RefObject } from "react";
import { motion } from "motion/react";
import { OCCASIONS, STAND_IN_PORTRAIT } from "../shared/catalog";
import { Frame, Hairline } from "./Frame";
import { Thumbs } from "./Thumbs";
import { LINE_LABEL, composeLooks, previewImage } from "./model";
import type { BriefController } from "./useBrief";
import { DNA_LABEL, type DnaController } from "./useDna";

interface Props {
  c: BriefController;
  d: DnaController;
  videoRef: RefObject<HTMLVideoElement>;
}

const HAIRLINE = 40;
const THUMBS = 120;
const THUMBS_AND_LINE = 160;
const THUMBS_AND_CAPTION = 168;

export function Canvas({ c, d, videoRef }: Props) {
  const reduced = c.reduced;
  const forming = useMemo(() => composeLooks(c.values, c.piece), [c.values, c.piece]);

  if (c.dnaMode) {
    const building = d.phase === "building";
    const label = building ? d.build.current?.label ?? "Done" : d.result ? "Your DNA" : `${d.filled} of 4${d.openLine ? `, ${DNA_LABEL[d.openLine]}` : d.complete ? ", ready" : ""}`;
    return (
      <Frame
        image={d.face?.image ?? null}
        alt="Your portrait"
        liveRef={videoRef}
        live={Boolean(d.stream)}
        reduced={reduced}
        belowHeight={d.result && !building ? 0 : HAIRLINE}
        below={
          d.result && !building ? null : building ? (
            <Hairline progress={d.build.progress} label={label} reduced={reduced} />
          ) : (
            <Hairline segments={4} filled={d.filled} label={label} reduced={reduced} />
          )
        }
      />
    );
  }

  const building = c.phase === "building";
  const rebuilding = c.phase === "rebuilding";
  const revealed = building ? Math.min(3, Math.floor(c.build.progress * 3.6)) : 0;
  const thumbs = building ? forming.slice(0, revealed) : c.looks;
  const hero = c.hero;
  const rendering = c.tryon && c.tryonBuild.done;

  const image = building
    ? revealed > 0
      ? forming[revealed - 1].image
      : previewImage(c.values)
    : c.resolved && hero
      ? hero.image
      : previewImage(c.values);

  const hairlineLabel =
    building || rebuilding
      ? c.build.current?.label ?? "Done"
      : c.tryon && !rendering
        ? c.tryonBuild.current?.label ?? "Done"
        : c.filled === 0
          ? "Your three looks appear here"
          : `${c.filled} of 6${c.openLine ? `, ${LINE_LABEL[c.openLine]}` : c.complete ? ", ready to build" : ""}`;

  if (c.done === "dna" && !c.values.for && !c.resolved) {
    return <Frame image={c.store.dna?.portrait ?? STAND_IN_PORTRAIT} alt="Your portrait" reduced={reduced} />;
  }

  const showThumbs = thumbs.length > 0;
  const showLine = !c.resolved || rebuilding || (c.tryon && !rendering);
  const belowHeight = showThumbs && showLine ? THUMBS_AND_LINE : showThumbs ? (rendering ? THUMBS_AND_CAPTION : THUMBS) : HAIRLINE;

  const overlay = c.tryon ? (
    <motion.div
      aria-hidden={!rendering}
      initial={false}
      animate={reduced ? { opacity: rendering ? 1 : 0 } : { clipPath: rendering ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" }}
      transition={reduced ? { duration: 0.2 } : { duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
      className="absolute inset-0"
      style={reduced ? undefined : { clipPath: "inset(0 100% 0 0)" }}
    >
      <img src={STAND_IN_PORTRAIT} alt={hero ? `Rendering of you wearing ${hero.title}` : ""} className="h-full w-full scale-[1.08] object-cover object-[50%_18%]" draggable={false} />
    </motion.div>
  ) : null;

  return (
    <Frame
      image={image}
      alt={hero && c.resolved ? hero.title : c.values.for ? `${c.occasion} mood` : ""}
      preview={c.values.for ? undefined : OCCASIONS}
      night={!c.resolved && c.values.when === "NIGHT"}
      dim={rebuilding}
      liveRef={videoRef}
      live={Boolean(c.stream)}
      overlay={overlay}
      reduced={reduced}
      belowHeight={belowHeight}
      below={
        <>
          {showLine ? (
            building || rebuilding || c.tryon ? (
              <Hairline progress={building || rebuilding ? c.build.progress : c.tryonBuild.progress} label={hairlineLabel} reduced={reduced} />
            ) : (
              <Hairline segments={6} filled={c.filled} label={hairlineLabel} reduced={reduced} />
            )
          ) : null}
          {showThumbs ? <Thumbs looks={thumbs} activeId={building ? null : hero?.id ?? null} onPick={c.swapHero} reduced={reduced} /> : null}
          {rendering ? (
            <p className="-mx-10 mt-2 whitespace-nowrap text-center text-[13px] leading-5 text-[var(--muted)] lg:mx-0">
              Rendered on you
              <span className="block">A rendering, not a photograph.</span>
            </p>
          ) : null}
        </>
      }
    />
  );
}
