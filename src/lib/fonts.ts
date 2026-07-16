/**
 * Font catalog — Google Fonts with tier restrictions.
 * Free: 3 fonts. Premium: all 10+.
 */

export interface FontDef {
  id: string;          // stored in DB
  name: string;        // display name
  family: string;      // CSS font-family (fallback chain)
  googleFamily: string; // Google Fonts family name (URL-safe)
  category: string;    // serif, sans-serif, handwritten, monospace
  tier: "free" | "premium";
}

export const FONTS: FontDef[] = [
  { id: "inter",           name: "Inter",           family: "'Inter', sans-serif",                         googleFamily: "Inter",           category: "sans-serif",   tier: "free" },
  { id: "merriweather",    name: "Merriweather",    family: "'Merriweather', serif",                      googleFamily: "Merriweather",    category: "serif",        tier: "free" },
  { id: "source-code-pro", name: "Source Code Pro", family: "'Source Code Pro', monospace",                googleFamily: "Source+Code+Pro", category: "monospace",     tier: "free" },
  { id: "playfair",        name: "Playfair Display",family: "'Playfair Display', serif",                  googleFamily: "Playfair+Display",category: "serif",        tier: "premium" },
  { id: "dancing-script",  name: "Dancing Script",  family: "'Dancing Script', cursive",                  googleFamily: "Dancing+Script",  category: "handwritten",  tier: "premium" },
  { id: "jetbrains-mono",  name: "JetBrains Mono",  family: "'JetBrains Mono', monospace",                googleFamily: "JetBrains+Mono",  category: "monospace",     tier: "premium" },
  { id: "lora",            name: "Lora",            family: "'Lora', serif",                              googleFamily: "Lora",            category: "serif",        tier: "premium" },
  { id: "crimson-text",    name: "Crimson Text",    family: "'Crimson Text', serif",                      googleFamily: "Crimson+Text",    category: "serif",        tier: "premium" },
  { id: "caveat",          name: "Caveat",          family: "'Caveat', cursive",                           googleFamily: "Caveat",          category: "handwritten",  tier: "premium" },
  { id: "space-mono",      name: "Space Mono",      family: "'Space Mono', monospace",                     googleFamily: "Space+Mono",      category: "monospace",     tier: "premium" },
];

/** Get a font definition by id. Falls back to Inter. */
export function getFont(id: string): FontDef {
  return FONTS.find((f) => f.id === id) ?? FONTS[0];
}

/** Filter fonts by user tier. */
export function getAvailableFonts(tier: "free" | "premium"): FontDef[] {
  if (tier === "premium") return FONTS;
  return FONTS.filter((f) => f.tier === "free");
}

/** Build a Google Fonts CSS URL for the given font IDs. */
export function googleFontsUrl(fontIds: string[]): string {
  const families = fontIds
    .map((id) => {
      const font = getFont(id);
      return `family=${font.googleFamily}:wght@400;700`;
    })
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
