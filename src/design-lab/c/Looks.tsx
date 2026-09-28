import { useEffect, useState } from "react";
import { useGo, useLab, useRelativePath } from "./context";
import { Dots, Primary } from "./controls";
import Deck from "./Deck";
import Frame from "./Frame";
import LookDetails from "./LookDetails";
import Sheet from "./Sheet";
import Stage from "./Stage";

function savedOn(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "today";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** A quiet library: the frame becomes a deck of what he saved, rendered on him. */
export default function Looks() {
  const { store, portraitSrc } = useLab();
  const go = useGo();
  const rel = useRelativePath();
  const openId = rel.split("/")[1] ?? "";
  const [index, setIndex] = useState(0);
  const items = store.looks;
  const current = items[Math.min(index, Math.max(0, items.length - 1))];
  const opened = openId ? items.find((s) => s.id === openId) : undefined;

  useEffect(() => {
    if (openId && !opened && items.length > 0) go("looks", true);
  }, [openId, opened, items.length, go]);

  useEffect(() => {
    if (opened) setIndex(items.indexOf(opened));
  }, [opened, items]);

  useEffect(() => {
    if (index > items.length - 1) setIndex(Math.max(0, items.length - 1));
  }, [items.length, index]);

  if (items.length === 0) {
    return (
      <Stage
        frame={<Frame image={portraitSrc} alt="Your frame" dim />}
        rail={
          <>
            <h1 className="text-[18px] font-medium">Nothing saved yet.</h1>
            <p className="max-w-[34ch] text-[16px] text-[var(--muted)]">Looks you save appear here, rendered on you, ready to wear again.</p>
            <Primary onClick={() => go("")}>Style a moment</Primary>
          </>
        }
      />
    );
  }

  const frame = (
    <Deck
      label="Saved looks"
      items={items.map((s) => ({ id: s.id, image: s.tryOnImage ?? s.look.image, alt: `${s.look.title} for ${s.occasionLabel.toLowerCase()}` }))}
      index={index}
      onIndex={setIndex}
      onOpen={(i) => go(`looks/${items[i].id}`)}
      openLabel="Open details"
      note="Rendered on you"
    />
  );

  const rail = current && (
    <>
      <p className="text-[14px] font-medium text-[var(--muted)]">
        {current.occasionLabel}, saved {savedOn(current.savedAt)}
        <span className="block">{items.length === 1 ? "1 look" : `${items.length} looks`}</span>
      </p>
      <h1 className="c-display text-[22px] lg:text-[26px]">{current.look.title}</h1>
      <p className="max-w-[36ch] text-[16px] text-[var(--text)]">{current.look.why}</p>
      {items.length > 1 && <Dots labels={items.map((s) => `${s.look.title} for ${s.occasionLabel.toLowerCase()}`)} index={index} onIndex={setIndex} />}
      <Primary onClick={() => go(`looks/${current.id}`)}>Open</Primary>
    </>
  );

  const sheet = opened && (
    <Sheet open label={`${opened.look.title} details`} onClose={() => go("looks", true)}>
      <LookDetails
        look={opened.look}
        occasionLabel={opened.occasionLabel}
        saved
        onSave={() => undefined}
        onRemove={() => {
          store.removeLook(opened.id);
          go("looks", true);
        }}
        onClose={() => go("looks", true)}
      />
    </Sheet>
  );

  return <Stage frame={frame} rail={rail} sheet={sheet} />;
}
