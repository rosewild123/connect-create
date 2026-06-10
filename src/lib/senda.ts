export const NICHES = [
  "Cosplay", "Fitness", "Glamour", "BDSM", "Feet", "Latina", "Asian", "Ebony",
  "Goth/Alt", "MILF", "Trans", "Couple", "Solo", "Fetish", "Roleplay", "ASMR",
];

export const PLATFORMS = ["OnlyFans", "Fansly", "ManyVids", "Pornhub", "Clips4Sale", "LoyalFans", "JustForFans", "Other"];

export const LOOKING_FOR = [
  { id: "shoots", label: "Shoots / scenes" },
  { id: "promos", label: "Cross-promos / shoutouts" },
  { id: "friendship", label: "Friendship in the industry" },
  { id: "mentorship", label: "Mentorship" },
];

export function ageFromDob(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

export type Platform = { platform: string; url: string };

export const SUPER_LIKES_FREE_DAILY = 1;
export const SUPER_LIKES_PLUS_DAILY = 5;
export const BOOSTS_PLUS_MONTHLY = 1;
export const BOOST_DURATION_MIN = 30;
