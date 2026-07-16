/** Curated emoji stickers organized by category. */

export interface StickerCategory {
  name: string;
  emojis: string[];
}

export const STICKER_CATEGORIES: StickerCategory[] = [
  {
    name: "Moods",
    emojis: ["😊", "😂", "🥰", "😎", "🤔", "😢", "😤", "🥳", "😴", "🤩", "😱", "🙄"],
  },
  {
    name: "Nature",
    emojis: ["🌸", "🌿", "🌈", "⭐", "🔥", "🌙", "☀️", "🌊", "🍂", "🌻", "🪐", "🌧️"],
  },
  {
    name: "Objects",
    emojis: ["📝", "💡", "🎵", "📚", "☕", "🎨", "📸", "💻", "✈️", "🎁", "🕯️", "🧵"],
  },
  {
    name: "Symbols",
    emojis: ["❤️", "💪", "✨", "🎉", "🙏", "💯", "🔑", "💭", "✅", "📍", "🎯", "🫶"],
  },
];

export const FREE_STICKER_LIMIT = 3;

/** Flat list of all emojis for quick lookup */
export const ALL_EMOJIS = STICKER_CATEGORIES.flatMap((c) => c.emojis);
