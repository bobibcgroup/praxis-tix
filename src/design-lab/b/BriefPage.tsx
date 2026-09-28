import { useLocation } from "react-router-dom";
import { Brief } from "./Brief";
import { Drawer } from "./Drawer";
import { BuyList, LooksLibrary, SharePanel } from "./DrawerPanels";
import { LooksColumn } from "./LooksColumn";
import { MobileSheet } from "./MobileSheet";
import { TopBar } from "./TopBar";
import { BASE, type Captures, type LabStore } from "./model";
import { DESKTOP, TABLET, useMediaQuery } from "./params";
import { PrimaryButton } from "./ui";
import { useBrief, type DrawerKind } from "./useBrief";

interface Props {
  store: LabStore;
  captures: Captures;
  setCaptures: (fn: (prev: Captures) => Captures) => void;
  /** True on /looks: the drawer opens on the saved looks. */
  library?: boolean;
}

const DRAWER_TITLE: Record<DrawerKind, string> = { looks: "Looks", buy: "Buy the pieces", share: "Share" };

function shareUrl(search: string): string {
  const params = new URLSearchParams(search);
  params.delete("drawer");
  const query = params.toString();
  return `${window.location.origin}${BASE}${query ? `?${query}` : ""}`;
}

/**
 * The one page. Brief on the left, looks on the right above 1024 px; on
 * mobile the brief is the screen and the looks arrive as a sheet.
 */
export default function BriefPage({ store, captures, setCaptures, library = false }: Props) {
  const desktop = useMediaQuery(DESKTOP);
  const tablet = useMediaQuery(TABLET);
  const location = useLocation();
  const c = useBrief(store, captures, setCaptures, library);
  const mobileResolved = !desktop && c.resolved;

  return (
    <main className="lg:grid lg:h-[100dvh] lg:grid-cols-[42fr_58fr] lg:overflow-hidden">
      <section
        aria-label="Your brief"
        className={`b-scroll flex min-h-[100dvh] flex-col px-[var(--gutter)] py-5 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:py-6 ${
          mobileResolved && !c.sheetOpen ? "pb-24" : ""
        }`}
      >
        <TopBar savedCount={store.looks.length} onLooks={() => c.openDrawer("looks")} onYou={c.toggleYou} />
        <Brief c={c} />
      </section>

      <section
        aria-label="Your looks"
        className="hidden lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:border-l lg:border-[var(--rule)] lg:px-[var(--gutter)] lg:py-6"
      >
        <div className="flex h-10 shrink-0 items-center justify-end">
          <span className="b-mono text-[13px] leading-none text-[var(--muted)]">{c.resolved ? c.sentence : ""}</span>
        </div>
        <div className="b-scroll mt-6 min-h-0 flex-1 overflow-y-auto">{desktop ? <LooksColumn c={c} layout="full" /> : null}</div>
      </section>

      {desktop ? null : (
        <MobileSheet open={c.resolved && c.sheetOpen} label="Your three looks" onClose={() => c.setSheetOpen(false)}>
          <LooksColumn c={c} layout={tablet ? "tablet" : "compact"} />
        </MobileSheet>
      )}

      {mobileResolved && !c.sheetOpen ? (
        <div className="fixed inset-x-[var(--gutter)] bottom-5 z-20">
          <PrimaryButton onClick={() => c.setSheetOpen(true)} className="w-full">
            Show the looks
          </PrimaryButton>
        </div>
      ) : null}

      <Drawer open={c.drawer !== null} title={c.drawer ? DRAWER_TITLE[c.drawer] : ""} onClose={c.closeDrawer}>
        {c.drawer === "looks" ? <LooksLibrary looks={store.looks} onRemove={store.removeLook} /> : null}
        {c.drawer === "buy" && c.hero ? <BuyList look={c.hero} /> : null}
        {c.drawer === "share" && c.hero ? <SharePanel look={c.hero} sentence={c.sentence} url={shareUrl(location.search)} /> : null}
        {(c.drawer === "buy" || c.drawer === "share") && !c.hero ? (
          <p className="text-[15px] text-[var(--muted)]">Resolve a brief first. The looks come before the shopping.</p>
        ) : null}
      </Drawer>
    </main>
  );
}
