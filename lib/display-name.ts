// Rules for a student's chosen display name.
//
// A display name may not impersonate a campus office or official ("Campus
// Police", "JSU Housing", "Corkboard Admin"…). Verification only proves the
// person controls an approved campus email — NOT their identity, and NOT any
// school endorsement (see docs/decisions.md → "Identity" and "Positioning").
// A name that borrows institutional authority is exactly the social-engineering
// case that undercuts that distinction.
//
// This runs in the browser for a friendly inline message, but it is NOT the
// security boundary: a direct API caller can skip it. The matching guard in
// migration 014 (a profiles trigger) is the real authority. Keep the reserved
// list here in sync with that trigger's regex.

export const MAX_DISPLAY_NAME = 30;

// Whole-word / phrase terms that read as an official campus entity.
const RESERVED_NAME_TERMS = [
  "corkboard",
  "jsu",
  "jackson state",
  "campus police",
  "campus security",
  "police",
  "housing",
  "financial aid",
  "registrar",
  "bookstore",
  "help desk",
  "helpdesk",
  "it support",
  "admin",
  "administrator",
  "official",
  "moderator",
  "faculty",
  "professor",
  "provost",
  "dean of",
  "university",
  "support team",
  "customer support",
];

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Returns a human-readable reason the name is not allowed, or null if it's fine.
// An empty name is allowed — the caller falls back to the student's J-number.
export function validateDisplayName(raw: string): string | null {
  const name = raw.trim();
  if (name.length === 0) return null;
  if (name.length > MAX_DISPLAY_NAME) {
    return `Please keep your name under ${MAX_DISPLAY_NAME} characters.`;
  }
  for (const term of RESERVED_NAME_TERMS) {
    // \b word boundaries so "police" is blocked but ordinary names aren't
    // caught by an accidental substring.
    if (new RegExp(`\\b${escapeRegExp(term)}\\b`, "i").test(name)) {
      return "Please choose a name that doesn’t impersonate a campus office or official (e.g. “Campus Police”, “JSU Housing”).";
    }
  }
  return null;
}
