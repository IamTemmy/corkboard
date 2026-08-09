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

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

// Does a term (via any of its variants) appear in this text? Whole-word match
// so a synonym like "tee" can't hide inside "canteen"; a raw substring fallback
// still allows partial typing ("head" → "headphones") and model numbers.
function termMatches(term: string, text: string): boolean {
  for (const variant of variantsOf(term)) {
    if (variant.includes(" ")) {
      if (text.includes(variant)) return true;
    } else if (new RegExp(`\\b${escapeRegExp(variant)}\\b`).test(text)) {
      return true;
    }
  }
  return term.length >= 3 && text.includes(term);
}

// Only the term itself (+ singular/plural), no synonyms — used to detect a
// *direct* title hit for ranking.
function rawMatches(term: string, text: string): boolean {
  for (const form of [singular(term), plural(singular(term))]) {
    if (new RegExp(`\\b${escapeRegExp(form)}\\b`).test(text)) return true;
  }
  return term.length >= 3 && text.includes(term);
}

// Everything a shopper might name, joined into one lowercase blob to search.
function haystackOf(listing: Listing): string {
  return [
    listing.title,
    listing.category,
    listing.condition,
    listing.description,
    listing.meetupSpot,
    listing.seller,
  ]
    .join(" ")
    .toLowerCase();
}

// Higher = better. A direct title hit beats a synonym title hit, which beats a
// match found only in the description/other fields.
function scoreOf(listing: Listing, terms: string[]): number {
  const title = listing.title.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (rawMatches(term, title)) score += 3;
    else if (termMatches(term, title)) score += 2;
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
    .filter((listing) => {
      const hay = haystackOf(listing);
      return terms.every((term) => termMatches(term, hay));
    })
    .map((listing, index) => ({ listing, index, score: scoreOf(listing, terms) }))
    // Sort by score desc; ties keep their original (newest-first) order.
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.listing);
}
