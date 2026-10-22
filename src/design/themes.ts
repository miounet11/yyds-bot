import type { ThemeName } from "../brief/types.js";

export interface DesignTokens {
  colorPrimary: string;
  colorAccent: string;
  colorAction: string;
  colorActionHover: string;
  colorBackground: string;
  colorSurface: string;
  colorText: string;
  colorMuted: string;
  colorLine: string;
  colorOnPrimary: string;
  colorActionText: string;
  radiusCard: string;
  radiusControl: string;
  fontSans: string;
  fontMono: string;
  spaceSection: string;
  maxWidth: string;
}

export const TOKEN_KEYS = [
  "colorPrimary",
  "colorAccent",
  "colorAction",
  "colorActionHover",
  "colorBackground",
  "colorSurface",
  "colorText",
  "colorMuted",
  "colorLine",
  "colorOnPrimary",
  "colorActionText",
  "radiusCard",
  "radiusControl",
  "fontSans",
  "fontMono",
  "spaceSection",
  "maxWidth"
] as const;

const SANS = '-apple-system, "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
const MONO = 'ui-monospace, "SFMono-Regular", "Source Code Pro", monospace';

export const THEME_PRESETS: Record<ThemeName, DesignTokens> = {
  "trust-navy": {
    colorPrimary: "#0F2942",
    colorAccent: "#C5A059",
    colorAction: "#1D4ED8",
    colorActionHover: "#1E40AF",
    colorBackground: "#F4F7FB",
    colorSurface: "#FFFFFF",
    colorText: "#0F172A",
    colorMuted: "#475569",
    colorLine: "#E2E8F0",
    colorOnPrimary: "#F8FAFC",
    colorActionText: "#FFFFFF",
    radiusCard: "16px",
    radiusControl: "12px",
    fontSans: SANS,
    fontMono: MONO,
    spaceSection: "48px",
    maxWidth: "1120px"
  },
  "elite-obsidian": {
    colorPrimary: "#141416",
    colorAccent: "#D4AF37",
    colorAction: "#E8C872",
    colorActionHover: "#D4AF37",
    colorBackground: "#0C0C0E",
    colorSurface: "#1C1C1F",
    colorText: "#F5F5F4",
    colorMuted: "#D6D3D1",
    colorLine: "#3F3F46",
    colorOnPrimary: "#FAFAF9",
    colorActionText: "#141416",
    radiusCard: "16px",
    radiusControl: "12px",
    fontSans: SANS,
    fontMono: MONO,
    spaceSection: "48px",
    maxWidth: "1120px"
  },
  "civic-ivory": {
    colorPrimary: "#1E3A8A",
    colorAccent: "#9A3412",
    colorAction: "#9A3412",
    colorActionHover: "#7C2D12",
    colorBackground: "#F8FAFC",
    colorSurface: "#FFFFFF",
    colorText: "#0F172A",
    colorMuted: "#334155",
    colorLine: "#E2E8F0",
    colorOnPrimary: "#F8FAFC",
    colorActionText: "#FFFFFF",
    radiusCard: "16px",
    radiusControl: "12px",
    fontSans: SANS,
    fontMono: MONO,
    spaceSection: "48px",
    maxWidth: "1120px"
  },
  "commercial-warm": {
    colorPrimary: "#2C1810",
    colorAccent: "#C46B3A",
    colorAction: "#0F6E56",
    colorActionHover: "#0B5543",
    colorBackground: "#F6F1EA",
    colorSurface: "#FFFFFF",
    colorText: "#1C1917",
    colorMuted: "#44403C",
    colorLine: "#E7E0D6",
    colorOnPrimary: "#FFFBF5",
    colorActionText: "#FFFFFF",
    radiusCard: "16px",
    radiusControl: "12px",
    fontSans: SANS,
    fontMono: MONO,
    spaceSection: "48px",
    maxWidth: "1120px"
  }
};

export const CSS_VAR: Record<(typeof TOKEN_KEYS)[number], string> = {
  colorPrimary: "--color-primary",
  colorAccent: "--color-accent",
  colorAction: "--color-action",
  colorActionHover: "--color-action-hover",
  colorBackground: "--color-background",
  colorSurface: "--color-surface",
  colorText: "--color-text",
  colorMuted: "--color-muted",
  colorLine: "--color-line",
  colorOnPrimary: "--color-on-primary",
  colorActionText: "--color-action-text",
  radiusCard: "--radius-card",
  radiusControl: "--radius-control",
  fontSans: "--font-sans",
  fontMono: "--font-mono",
  spaceSection: "--space-section",
  maxWidth: "--max-width"
};

export function resolveTokens(theme: ThemeName, overrides: Record<string, string>): DesignTokens {
  return { ...THEME_PRESETS[theme], ...overrides } as DesignTokens;
}

export const COMPONENT_MARKERS = [
  "topbar",
  "trust-card",
  "offer-card",
  "answer-first",
  "fact-table",
  "faq-list",
  "bottom-bar",
  "cta",
  "site-layout"
] as const;
