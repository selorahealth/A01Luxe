// Client-side, network-free product parser for the WhatsApp-style Add Product
// chat. Works fully offline; runs on every message the admin types.

export type ParsedProduct = {
  name?: string;
  description: string;
  priceNaira?: number;
  sizes: string[];
  colors: string[];
  stock?: number;
};

const COLOR_WORDS = [
  "black", "white", "off white", "red", "blue", "navy", "sky blue", "green", "olive",
  "grey", "gray", "brown", "tan", "cream", "beige", "bone", "gold", "silver",
  "pink", "purple", "orange", "yellow", "burgundy", "wine", "multi",
];

const LETTER_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "2XL", "3XL"];

function digitsOnly(v: string): number {
  const n = Number(v.replace(/[,\s]/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

function parsePrice(text: string): number | undefined {
  const explicit = text.match(/(?:₦|ngn|naira|#)\s*([\d][\d,]*(?:\.\d+)?)/i);
  if (explicit) {
    const n = digitsOnly(explicit[1]);
    if (n >= 100) return Math.round(n);
  }
  const kSuffix = text.match(/(?:₦|ngn|naira)?\s*(\d+(?:\.\d+)?)\s*k\b/i);
  if (kSuffix) {
    const n = Number(kSuffix[1]) * 1000;
    if (n >= 500) return Math.round(n);
  }
  // Bare number: ignore two-digit size-range numbers (35–48) and small counts.
  const bare = text.match(/(?:^|[\s(])(\d{1,3}(?:,\d{3})+|\d{4,7})(?:\s|$|[\s.,)])/);
  if (bare) {
    const n = digitsOnly(bare[1]);
    if (n >= 500 && !(n >= 35 && n <= 48)) return Math.round(n);
  }
  return undefined;
}

function parseSizes(text: string): string[] {
  const sizes = new Set<string>();
  const numeric = text.matchAll(/(?:^|[\s,(])(3[5-9]|4[0-8])(?=[\s,)|.]|$)/g);
  for (const m of numeric) sizes.add(m[1]);
  for (const ls of LETTER_SIZES) {
    if (new RegExp(`(?:^|[\\s,(])${ls}(?=[\\s,)|.]|$)`, "i").test(text)) sizes.add(ls === "2XL" || ls === "XXL" ? "XXL" : ls);
  }
  return [...sizes];
}

function parseColors(text: string): string[] {
  const found: string[] = [];
  const push = (w: string) => {
    const norm = w.toLowerCase().trim();
    if (norm && !found.includes(norm)) found.push(norm);
  };
  const labeled = text.matchAll(/colo?u?rs?\s*[:\-]\s*([^\n]+)/gi);
  for (const m of labeled) {
    m[1].split(/[,/&]|\band\b/i).forEach((c) => {
      const cleaned = c.trim().replace(/\.$/, "");
      if (cleaned.length <= 20) push(cleaned);
    });
  }
  if (found.length === 0) {
    for (const w of COLOR_WORDS) {
      if (new RegExp(`(?:^|[^a-z])${w}(?:[^a-z]|$)`, "i").test(text)) push(w);
    }
  }
  return found;
}

function parseStock(text: string): number | undefined {
  const labeled = text.match(/stock\s*[:\-]?\s*(\d{1,3})/i);
  if (labeled) return Number(labeled[1]);
  const count = text.match(/(\d{1,3})\s*(?:pcs|pieces|pairs?)\s+(?:available|left|in stock)/i);
  if (count) return Number(count[1]);
  return undefined;
}

function cleanName(line: string): string {
  let name = line
    .replace(/(?:₦|ngn|naira|#)\s*[\d,\.]+/gi, " ")
    .replace(/\b\d+(?:\.\d+)?\s*k\b/gi, " ")
    .replace(/(?:^|[\s,(])(3[5-9]|4[0-8])(?=[\s,)|.]|$)/g, " ")
    .replace(/\b(XS|S|M|L|XL|XXL|XXXL|2XL|3XL)\b/gi, " ")
    .replace(/colo?u?rs?\s*[:\-][^\n]*/gi, " ")
    .replace(/stock\s*[:\-]?\s*\d{1,3}/gi, " ")
    .replace(/\s*[-–|]\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (name.length > 60) name = name.slice(0, 60).trim();
  return name;
}

export function parseProductFromText(rawText: string): ParsedProduct {
  const text = rawText.trim();
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const priceNaira = parsePrice(text);
  const sizes = parseSizes(text);
  const colors = parseColors(text);
  const stock = parseStock(text);

  let name: string | undefined;
  for (const line of lines) {
    const candidate = cleanName(line);
    // A usable name has letters and isn't just numbers/sizes.
    if (candidate && /[a-z]/i.test(candidate) && candidate.replace(/[^a-z]/gi, "").length >= 2) {
      name = candidate;
      break;
    }
  }

  const description = lines
    .slice(name ? 1 : 0)
    .filter((l) => l !== name)
    .join("\n")
    .slice(0, 2000);

  return { name, description, priceNaira, sizes, colors, stock };
}

export function missingFields(p: ParsedProduct, imageCount: number): string[] {
  const missing: string[] = [];
  if (!p.name) missing.push("the product name");
  if (!p.priceNaira) missing.push("the price (e.g. ₦45,000)");
  if (imageCount < 1) missing.push("at least 1 photo");
  return missing;
}
