import type { Listing } from "./listings";

// Client-side search for the marketplace board. Deliberately simple and
// dependency-free — good for a single campus's worth of listings. If Corkboard
// ever reaches a scale where this strains (tens of thousands of listings across
// many schools), replace it with Postgres full-text search behind getListings();
// the call site (searchListings) stays the same.
//
// It improves on plain substring matching in four ways:
//   1. searches the description + condition + spot + seller, not just the title
//   2. a central synonym map, so "shoe" finds sneakers and "couch" finds a sofa
//   3. simple singular/plural handling ("shoe" ↔ "shoes")
//   4. ranks title matches above description/synonym matches

// Interchangeable terms — searching any word in a group also finds the others.
// Central and extensible: add a row as students use new words for things.
// Not meant to be exhaustive; it just covers the common campus-resale cases.
const SYNONYM_GROUPS: string[][] = [
  ["shoe", "sneaker", "trainer", "footwear", "kicks"],
  ["couch", "sofa", "sectional", "loveseat", "futon"],
  ["tv", "television", "roku"],
  ["fridge", "refrigerator"],
  ["headphone", "earbud", "airpod", "headset", "earphone"],
  ["shirt", "tee", "jersey"],
  ["laptop", "macbook", "chromebook"],
  ["phone", "iphone", "smartphone"],
  ["book", "textbook"],
  ["backpack", "bookbag"],
  ["bike", "bicycle"],
  // Model aliases so typing it short still finds the full name.
  ["af1", "air force", "air force one"],
];

// One-directional hints: searching a general TYPE word (the key) ALSO matches
// items named only by brand or model — so "shoe" finds a listing titled just
// "Nike Air Force 1" or "Suede Sandals" that never says "shoe". It does NOT go
// the other way: searching "nike" stays literal and won't return every sneaker.
//
// Precision/recall note: model names (air force, jordan, yeezy) and shoe-only
// brands (converse, vans, crocs) are safe. General brands (nike, adidas, puma)
// widen the net most but can occasionally surface that brand's apparel under a
// "shoe" search — trim them here if that ever gets noisy.
const TYPE_INDICATORS: Record<string, string[]> = {
  shoe: [
    // brands
    "nike", "adidas", "puma", "jordan", "new balance", "converse", "vans",
    "crocs", "reebok", "asics", "saucony", "birkenstock", "timberland",
    // models / lines
    "air force", "af1", "air max", "dunk", "yeezy", "samba", "gazelle",
    "superstar", "ultraboost", "mayze", "550", "990", "9060",
    // other footwear types
    "sandal", "slide", "cleat", "boot", "loafer", "moccasin", "flip flop",
  ],
};

// Naive singular/plural: enough for everyday nouns without a stemming library.
function singular(word: string): string {
  return word.length > 3 && word.endsWith("s") && !word.endsWith("ss")
    ? word.slice(0, -1)
    : word;
}
function plural(word: string): string {
  return word.endsWith("s") ? word : `${word}s`;
}

// singular(word) → its synonym group, so a lookup ignores plural forms.
const SYNONYM_LOOKUP = new Map<string, string[]>();
for (const group of SYNONYM_GROUPS) {
  for (const word of group) {
    SYNONYM_LOOKUP.set(singular(word), group);
  }
}

// Split text into lowercase word tokens (letters/digits), dropping punctuation.
function tokenize(text: string): string[] {
  return text.split(/[^a-z0-9]+/).filter(Boolean);
}

// All the words a single query term should also match: its synonyms, each in
// singular and plural form.
function variantsOf(term: string): Set<string> {
  const base = singular(term);
  const group = SYNONYM_LOOKUP.get(base) ?? [term];
  const set = new Set<string>();
  const add = (word: string) => {
    const s = singular(word);
    set.add(s);
    set.add(plural(s));
  };
  for (const word of [...group, term]) add(word);
  // If this is a general type word (e.g. "shoe"/"sneaker" — both in the shoe
  // group, which contains the key "shoe"), also match brand/model indicators.
  // One-directional: indicators are never keys, so searching a brand won't pull
  // in the whole type.
  for (const member of group) {
    for (const indicator of TYPE_INDICATORS[singular(member)] ?? []) add(indicator);
  }
  return set;
}

// The searchable content of a listing: one lowercase blob plus its word tokens.
type Fields = { text: string; words: string[] };
function fieldsOf(listing: Listing): Fields {
  const text = [
    listing.title,
    listing.category,
    listing.condition,
    listing.description,
    listing.meetupSpot,
    listing.seller,
  ]
    .join(" ")
    .toLowerCase();
  return { text, words: tokenize(text) };
}

// Does a query term match these fields? Two ways, both intuitive as you type:
//   1. a synonym/brand variant equals a whole word (or, for phrases like "air
//      force", appears in the text) — so "sneaker" pulls in the shoe family;
//   2. the raw term is a PREFIX of some word — so typing "sne"→"sneak"→"sneaker"
//      narrows smoothly instead of the results jumping around.
function termMatches(term: string, { text, words }: Fields): boolean {
  for (const variant of variantsOf(term)) {
    if (variant.includes(" ")) {
      if (text.includes(variant)) return true;
    } else if (words.includes(variant)) {
      return true;
    }
  }
  return words.some((word) => word.startsWith(term));
}

// The term itself only (no synonyms) — used to spot a *direct* title hit.
function rawMatches(term: string, { text, words }: Fields): boolean {
  for (const form of [singular(term), plural(singular(term)), term]) {
    if (form.includes(" ") ? text.includes(form) : words.includes(form)) return true;
  }
  return words.some((word) => word.startsWith(term));
}

// Higher = better. A direct title hit beats a synonym title hit, which beats a
// match found only in the description/other fields.
function scoreOf(titleFields: Fields, terms: string[]): number {
  let score = 0;
  for (const term of terms) {
    if (rawMatches(term, titleFields)) score += 3;
    else if (termMatches(term, titleFields)) score += 2;
    else score += 1;
  }
  return score;
}

/**
 * Filter listings to those matching every word in `query`, then rank so the
 * strongest (title) matches come first. An empty query returns the input as-is
 * (preserving the caller's order — newest first).
 */
export function searchListings(listings: Listing[], query: string): Listing[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return listings;

  return listings
    .map((listing, index) => ({
      listing,
      index,
      fields: fieldsOf(listing),
    }))
    .filter((entry) => terms.every((term) => termMatches(term, entry.fields)))
    .map((entry) => {
      const titleFields: Fields = {
        text: entry.listing.title.toLowerCase(),
        words: tokenize(entry.listing.title.toLowerCase()),
      };
      return { ...entry, score: scoreOf(titleFields, terms) };
    })
    // Sort by score desc; ties keep their original (newest-first) order.
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.listing);
}
