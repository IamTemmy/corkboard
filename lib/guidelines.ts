// Single source of truth for Corkboard's community guidelines and prohibited
// items. Both the /guidelines page and the "list an item" form read from here,
// so the rules shown at listing time can never drift from the full policy.
//
// This is a sensible default for a campus marketplace. It's deliberately easy to
// edit in one place — the exact allowed/banned list will be refined after the
// JSU policy conversation. Keep it aligned with the law and JSU campus rules.

export type ProhibitedItem = {
  /** Short label for the category of banned item. */
  title: string;
  /** One-line explanation of what falls under it. */
  detail: string;
};

// What may NOT be listed. Ordered roughly by how clearly off-limits it is.
export const PROHIBITED_ITEMS: ProhibitedItem[] = [
  {
    title: "Weapons & ammunition",
    detail:
      "Firearms, ammunition, and any weapon banned on campus. This includes replicas, airsoft, and tactical knives.",
  },
  {
    title: "Drugs & paraphernalia",
    detail:
      "Illegal drugs, controlled substances, vapes, and anything used to consume them.",
  },
  {
    title: "Alcohol & tobacco",
    detail:
      "Alcohol, tobacco, and nicotine products of any kind — even sealed or unopened.",
  },
  {
    title: "Prescription & medical items",
    detail:
      "Prescription medication, supplements sold as medicine, and used medical devices.",
  },
  {
    title: "Stolen or counterfeit goods",
    detail:
      "Anything you don't own outright, plus fakes, replicas, or knock-offs sold as genuine.",
  },
  {
    title: "Academic dishonesty",
    detail:
      "Essays, completed assignments, exam answers, or any service meant to cheat coursework.",
  },
  {
    title: "Recalled & hazardous items",
    detail:
      "Recalled products, fireworks, chemicals, or anything unsafe to hand off in person.",
  },
  {
    title: "Live animals",
    detail: "Pets and animals of any kind aren't sold or rehomed here.",
  },
  {
    title: "Adult content & services",
    detail:
      "Sexual content or services, and anything you wouldn't post on a campus bulletin board.",
  },
];

// The good-conduct rules — how buyers and sellers are expected to behave.
export const COMMUNITY_RULES: ProhibitedItem[] = [
  {
    title: "Be honest",
    detail:
      "Describe items accurately, use your own photos, and set a fair price. No bait-and-switch.",
  },
  {
    title: "Meet safely on campus",
    detail:
      "Exchanges happen at the campus spot on the listing. It's fine to bring a friend.",
  },
  {
    title: "It's cash in person, no shipping",
    detail:
      "Corkboard has no payments or shipping. Never send money before you have the item in hand.",
  },
  {
    title: "Treat people with respect",
    detail:
      "No harassment, hate speech, or spam. Report anything that crosses the line.",
  },
];

// Shown at listing time — the label next to the "I confirm" acknowledgment.
export const LISTING_ACKNOWLEDGMENT =
  "I confirm this item is mine to sell and follows the community guidelines.";
