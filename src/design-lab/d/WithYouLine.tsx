import { useState, type RefObject } from "react";
import { STAND_IN_PORTRAIT, type Piece } from "../shared/catalog";
import { BriefLine } from "./BriefLine";
import { Capture } from "./Capture";
import { Chips } from "./Chips";
import { SAMPLE_PIECES, SLOTS, ownPieceName, type FaceValue, type PieceInput } from "./model";
import { TextButton } from "./ui";
import type { BriefController } from "./useBrief";

function summary(face: FaceValue | null, piece: PieceInput | null): string | null {
  const parts: string[] = [];
  if (face) parts.push(face.source === "dna" ? "Your face, from your DNA" : "Your face");
  if (piece) parts.push(piece.name);
  return parts.length ? parts.join(", ") : null;
}

interface Props {
  c: BriefController;
  videoRef: RefObject<HTMLVideoElement>;
}

/** The sixth line: two optional switches, each with a small inline capture area. */
export function WithYouLine({ c, videoRef }: Props) {
  const [pieceOpen, setPieceOpen] = useState(false);
  const [slot, setSlot] = useState<Piece["slot"]>(c.piece?.slot ?? "top");

  const pieceValue: FaceValue | null = c.piece ? { source: c.piece.source, image: c.piece.image ?? "" } : null;

  return (
    <BriefLine id="with" label="With you" value={summary(c.face, c.piece)} placeholder="Optional" open={c.openLine === "with"} onToggle={() => c.toggleLine("with")}>
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-[16px] font-medium leading-5 lg:text-[15px]">Your face</p>
          <p className="mb-2 text-[13px] leading-4 text-[var(--muted)]">Reads your tones and lets you see the look on you. Optional.</p>
          <Capture subject="your face" sample={STAND_IN_PORTRAIT} value={c.face} onChange={c.setFace} camera videoRef={videoRef} onStream={c.setStream} />
        </div>
        <div>
          <p className="text-[16px] font-medium leading-5 lg:text-[15px]">One of your pieces</p>
          <p className="mb-2 text-[13px] leading-4 text-[var(--muted)]">The looks are built around it. Optional.</p>
          {pieceOpen || c.piece ? (
            <div className="flex flex-col gap-2">
              {c.piece ? null : <Chips<Piece["slot"]> name="Which piece it is" options={SLOTS} value={slot} onChange={setSlot} />}
              <Capture
                subject="your piece"
                sample=""
                label={c.piece?.name}
                value={pieceValue}
                onChange={(value) => {
                  c.setPiece(
                    value
                      ? { slot, source: value.source === "own" ? "own" : "sample", name: value.source === "own" ? ownPieceName(slot) : SAMPLE_PIECES[slot], image: value.source === "own" ? value.image : null }
                      : null,
                  );
                  if (!value) setPieceOpen(false);
                }}
              />
            </div>
          ) : (
            <TextButton onClick={() => setPieceOpen(true)} className="-ml-2">
              Add a piece
            </TextButton>
          )}
        </div>
      </div>
    </BriefLine>
  );
}
