/**
 * Three brand directions for the Praxis rebrand and three element systems.
 * Brand = colour, type, mood. System = shape and construction of controls.
 * Any brand can be combined with any system; the specimen page renders them
 * from these tokens only.
 */

export type BrandId = "chalk" | "forest" | "stone";
export type SystemId = "hairline" | "soft" | "pill";
export type Mode = "light" | "dark";

export interface Palette {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  rule: string;
  accent: string;
  accentFg: string;
  accentTint: string;
  /** Ink used for the selected state in the Hairline system. */
  ink: string;
  inkFg: string;
}

export interface Brand {
  id: BrandId;
  name: string;
  mood: string;
  words: readonly string[];
  why: string;
  display: string;
  displayWeight: number;
  displayTracking: string;
  body: string;
  mono: string;
  light: Palette;
  dark: Palette;
  /** Swatch roles shown on the page, in order. */
  swatches: ReadonlyArray<{ role: string; key: keyof Palette }>;
}

export const BRANDS: readonly Brand[] = [
  {
    id: "chalk",
    name: "Chalk and Ink",
    mood: "Decisive, editorial, cold luxury. A tailor's chalk mark on dark cloth.",
    words: ["direct", "sharp", "quiet", "certain"],
    why: "A stylist's interface must never compete with the clothes. Monochrome chrome lets every garment carry its own colour, and one red mark says: this is the decision.",
    display: "'Instrument Sans', sans-serif",
    displayWeight: 600,
    displayTracking: "-0.02em",
    body: "'Geist', sans-serif",
    mono: "'Geist Mono', monospace",
    light: {
      bg: "#F2F1EC",
      surface: "#E8E7E1",
      text: "#16181B",
      muted: "#6B6D6A",
      rule: "#D3D1C9",
      accent: "#D9482B",
      accentFg: "#FFFFFF",
      accentTint: "#F6E1DA",
      ink: "#16181B",
      inkFg: "#F2F1EC",
    },
    dark: {
      bg: "#131416",
      surface: "#1C1D20",
      text: "#EDEBE4",
      muted: "#9A9993",
      rule: "#2B2C30",
      accent: "#E8593B",
      accentFg: "#131416",
      accentTint: "#3A241E",
      ink: "#EDEBE4",
      inkFg: "#131416",
    },
    swatches: [
      { role: "Chalk", key: "bg" },
      { role: "Ink", key: "text" },
      { role: "Grey", key: "muted" },
      { role: "Rule", key: "rule" },
      { role: "Mark", key: "accent" },
    ],
  },
  {
    id: "forest",
    name: "Forest and Bone",
    mood: "Grounded, confident, heritage made modern. The current green, taken seriously.",
    words: ["assured", "warm", "classic", "trusted"],
    why: "Keeps the equity of the existing green and serif but commits to them: a true forest instead of a washed sage, bone instead of off-white, and a serif at a weight that prints, not whispers.",
    display: "'Source Serif 4', serif",
    displayWeight: 600,
    displayTracking: "-0.01em",
    body: "'Geist', sans-serif",
    mono: "'Geist Mono', monospace",
    light: {
      bg: "#EFEAE0",
      surface: "#E4DED2",
      text: "#1B1F1C",
      muted: "#646860",
      rule: "#D0C9BA",
      accent: "#1F3A2E",
      accentFg: "#EFEAE0",
      accentTint: "#DBE4DB",
      ink: "#1B1F1C",
      inkFg: "#EFEAE0",
    },
    dark: {
      bg: "#121614",
      surface: "#1A201C",
      text: "#ECE7DC",
      muted: "#98998F",
      rule: "#263029",
      accent: "#7FB090",
      accentFg: "#121614",
      accentTint: "#1F2E26",
      ink: "#ECE7DC",
      inkFg: "#121614",
    },
    swatches: [
      { role: "Bone", key: "bg" },
      { role: "Ink", key: "text" },
      { role: "Grey", key: "muted" },
      { role: "Rule", key: "rule" },
      { role: "Forest", key: "accent" },
    ],
  },
  {
    id: "stone",
    name: "Stone and Terracotta",
    mood: "Warm, human, Mediterranean. Sun on limestone, one clay accent.",
    words: ["approachable", "warm", "contemporary", "regional"],
    why: "Speaks to Beirut and the Gulf without cliché: cool stone greys carry the interface, a single terracotta gives it a pulse, and a grotesk with character keeps it from feeling like every other app.",
    display: "'Bricolage Grotesque', sans-serif",
    displayWeight: 600,
    displayTracking: "-0.015em",
    body: "'Manrope', sans-serif",
    mono: "'Geist Mono', monospace",
    light: {
      bg: "#F1EFEA",
      surface: "#E6E3DC",
      text: "#24262A",
      muted: "#6E7077",
      rule: "#D3D0C8",
      accent: "#B4573A",
      accentFg: "#FFFFFF",
      accentTint: "#F2E0D8",
      ink: "#24262A",
      inkFg: "#F1EFEA",
    },
    dark: {
      bg: "#16171A",
      surface: "#1F2024",
      text: "#EAE8E2",
      muted: "#979A9F",
      rule: "#2C2E33",
      accent: "#D9785B",
      accentFg: "#16171A",
      accentTint: "#3A2620",
      ink: "#EAE8E2",
      inkFg: "#16171A",
    },
    swatches: [
      { role: "Stone", key: "bg" },
      { role: "Slate", key: "text" },
      { role: "Grey", key: "muted" },
      { role: "Rule", key: "rule" },
      { role: "Terracotta", key: "accent" },
    ],
  },
];

export interface ElementSystem {
  id: SystemId;
  name: string;
  line: string;
  rules: readonly string[];
  /** CSS custom properties applied on the specimen root. */
  vars: Record<string, string>;
}

export const SYSTEMS: readonly ElementSystem[] = [
  {
    id: "hairline",
    name: "Hairline",
    line: "Sharp corners, one-pixel lines, ink fill for the selected state. Editorial and exact.",
    rules: [
      "Controls are 44 px tall. Text is vertically centred by the box, never by padding.",
      "Label and hint sit on one baseline: 15 px medium, then 13 px muted, 8 px apart.",
      "Corners: 0 on frames, 2 px on controls. Borders are 1 px, in the rule colour.",
      "Selected: ink fill, background text. Hover: surface fill. Pressed: scale 0.98.",
      "Progress: six 2 px segments with 4 px gaps and a tabular count on the left.",
      "Active thumbnail: 2 px accent underline flush to the print, 4 px below.",
    ],
    vars: {
      "--r-control": "2px",
      "--r-frame": "0px",
      "--r-thumb": "0px",
      "--control-border": "1px solid var(--rule)",
      "--control-bg": "transparent",
      "--control-hover-bg": "var(--surface)",
      "--selected-bg": "var(--ink)",
      "--selected-fg": "var(--ink-fg)",
      "--selected-border": "1px solid var(--ink)",
      "--secondary-border": "1px solid var(--text)",
      "--brief-rule": "1px solid var(--rule)",
    },
  },
  {
    id: "soft",
    name: "Soft",
    line: "Eight-pixel corners, no borders, filled surfaces. Calm and modern.",
    rules: [
      "Controls are 44 px tall with a surface fill and no border; the fill is the edge.",
      "Label and hint on one baseline, as in Hairline; hint colour is the muted grey.",
      "Corners: 8 px on controls, 12 px on frames. Nothing is sharp, nothing is a pill.",
      "Selected: accent tint fill, accent text. Hover: surface darkened 4%. Pressed: scale 0.98.",
      "Progress: six numbered steps, 24 px discs joined by a 1 px line; done steps fill with accent.",
      "Active thumbnail: 2 px accent border on the print itself.",
    ],
    vars: {
      "--r-control": "8px",
      "--r-frame": "12px",
      "--r-thumb": "8px",
      "--control-border": "1px solid transparent",
      "--control-bg": "var(--surface)",
      "--control-hover-bg": "color-mix(in srgb, var(--surface) 92%, var(--text))",
      "--selected-bg": "var(--accent-tint)",
      "--selected-fg": "var(--accent)",
      "--selected-border": "1px solid transparent",
      "--secondary-border": "1px solid transparent",
      "--brief-rule": "1px solid transparent",
    },
  },
  {
    id: "pill",
    name: "Pill",
    line: "Full-radius controls on 16-pixel frames, hairline outlines, accent fill when chosen. Tactile.",
    rules: [
      "Controls are 44 px tall, full radius, with 20 px horizontal inset so the text clears the curve.",
      "Label and hint on one baseline; the hint is dropped below 480 px so pills never wrap.",
      "Corners: 999 px on controls, 16 px on frames and thumbnails.",
      "Selected: accent fill, accent foreground. Hover: surface fill. Pressed: scale 0.97.",
      "Progress: a 40 px ring with the count inside, plus six dots underneath the frame.",
      "Active thumbnail: 2 px accent ring, offset 3 px from the print.",
    ],
    vars: {
      "--r-control": "999px",
      "--r-frame": "16px",
      "--r-thumb": "12px",
      "--control-border": "1px solid var(--rule)",
      "--control-bg": "transparent",
      "--control-hover-bg": "var(--surface)",
      "--selected-bg": "var(--accent)",
      "--selected-fg": "var(--accent-fg)",
      "--selected-border": "1px solid var(--accent)",
      "--secondary-border": "1px solid var(--text)",
      "--brief-rule": "1px solid var(--rule)",
    },
  },
];

export function paletteVars(p: Palette): Record<string, string> {
  return {
    "--bg": p.bg,
    "--surface": p.surface,
    "--text": p.text,
    "--muted": p.muted,
    "--rule": p.rule,
    "--accent": p.accent,
    "--accent-fg": p.accentFg,
    "--accent-tint": p.accentTint,
    "--ink": p.ink,
    "--ink-fg": p.inkFg,
  };
}
