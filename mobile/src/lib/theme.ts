// Website-matched theme — mobile now mirrors website/src/index.css
export const theme = {
  // core - website :root
  paper: "#ffffff",
  ink: "#0b0b0c",
  muted: "rgba(11,11,12,0.66)",
  faint: "rgba(11,11,12,0.52)",
  line: "rgba(11,11,12,0.12)",
  smoke: "#f9eff2",
  card: "#ffffff",
  night: "#0b0b0c",
  night2: "#151517",
  nightMuted: "rgba(255,255,255,0.70)",
  pop: "#ff3d5c",
  popDeep: "#e11d48",
  popSoft: "rgba(255,61,92,0.10)",
  // derived for RN - blush wash
  blushLight: "rgba(255,61,92,0.06)",
  blushMid: "rgba(255,61,92,0.09)",
  blushStrong: "rgba(255,61,92,0.085)",
  shadow: "rgba(11,11,12,0.14)",
  shadowNav: "rgba(11,11,12,0.07)",
  // legacy dark kept for reference but not used now
} as const;

export const fonts = {
  sans: "SpaceGrotesk_400Regular",
  medium: "SpaceGrotesk_500Medium",
  bold: "SpaceGrotesk_700Bold",
} as const;
