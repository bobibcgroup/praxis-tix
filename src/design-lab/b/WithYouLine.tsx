import { useState } from "react";
import { STAND_IN_PORTRAIT, type Piece } from "../shared/catalog";
import { BriefLine } from "./BriefLine";
import { Capture } from "./Capture";
import { Chips } from "./Chips";
import { SAMPLE_PIECES, SLOTS, ownPieceName, type CaptureValue, type PieceInput } from "./model";
import { TextButton } from "./ui";
import type { BriefController } from "./useBrief";

function summary(face: CaptureValue | null, piece: PieceInput | null): string | null {
  const parts: string[] = [];
  if (face) parts.push("Your face");
  if (piece) parts.push(`${SLOTS.find((s) => s.id === piece.slot)?.label}: ${piece.name}`);
  return parts.length ? parts.join(", ") : null;
}

function toPiece(slot: Piece["slot"], value: CaptureValue): PieceInput {
  const own = value.source === "camera" || value.source === "upload";
  return {
    slot,
    source: value.source,
    name: own ? ownPieceName(slot) : SAMPLE_PIECES[slot].name,
    image: value.image,
  };
}

interface BlockProps {
  title: string;
  hint: string;
  children: React.ReactNode;
}

function Block({ title, hint, children }: BlockProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
      <div className="sm:w-[176px] sm:shrink-0">
        <p className="text-[15px] font-medium leading-5 text-[var(--ink)]">{title}</p>
        <p className="mt-0.5 text-[13px] leading-4 text-[var(--muted)]">{hint}</p>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** The sixth line: two optional switches, each with a small inline capture area. */
export function WithYouLine({ c }: { c: BriefController }) {
  const [faceOpen, setFaceOpen] = useState(false);
  const [pieceOpen, setPieceOpen] = useState(false);
  const [slot, setSlot] = useState<Piece["slot"]>(c.piece?.slot ?? "top");

  const pieceValue: CaptureValue | null = c.piece ? { source: c.piece.source, image: c.piece.image } : null;

  return (
    <BriefLine
      id="with"
      label="With you"
      value={summary(c.face, c.piece)}
      note={c.face && !c.piece ? c.faceNote : undefined}
      open={c.openLine === "with"}
      onToggle={() => c.toggleLine("with")}
    >
      <div className="flex flex-col gap-5 text-[var(--ink)]">
        <Block title="Your face" hint="Reads your tones and lets you see the look on you.">
          {faceOpen || c.face ? (
            <Capture
              subject="your face"
              sample={STAND_IN_PORTRAIT}
              value={c.face}
              onChange={(value) => {
                c.setFace(value);
                if (!value) setFaceOpen(false);
              }}
            />
          ) : (
            <TextButton onClick={() => setFaceOpen(true)}>Add your face</TextButton>
          )}
        </Block>
        <Block title="One of your pieces" hint="The looks are built around it.">
          {pieceOpen || c.piece ? (
            <div className="flex flex-col gap-3">
              {c.piece ? null : <Chips<Piece["slot"]> name="Which slot the piece fills" options={SLOTS} value={slot} onChange={(id) => setSlot(id)} />}
              <Capture
                subject="your piece"
                sample={SAMPLE_PIECES[slot].image}
                portrait={false}
                label={c.piece?.name}
                value={pieceValue}
                onChange={(value) => {
                  c.setPiece(value ? toPiece(slot, value) : null);
                  if (!value) setPieceOpen(false);
                }}
              />
            </div>
          ) : (
            <TextButton onClick={() => setPieceOpen(true)}>Add a piece</TextButton>
          )}
        </Block>
      </div>
    </BriefLine>
  );
}
