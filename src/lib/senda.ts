export const NICHES = [
  "Cosplay", "Fitness", "Glamour", "BDSM", "Dom", "Sub", "Feet", "Latina", "Asian", "Ebony",
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
export const SUPER_LIKES_PREMIUM_DAILY = 999;
export const BOOSTS_PLUS_MONTHLY = 1;
export const BOOSTS_PREMIUM_MONTHLY = 4;
export const BOOST_DURATION_MIN = 30;

export const PRICE_PLUS = "senda_plus_monthly_gbp";
export const PRICE_PREMIUM = "senda_premium_monthly_gbp";
export const PRICE_BOOST_SINGLE = "senda_boost_single_gbp";
export const BOOST_SINGLE_PRICE_LABEL = "£2.99";

export type Tier = "free" | "plus" | "premium";

export function tierFromPriceId(priceId: string | null | undefined): Tier {
  if (priceId === PRICE_PREMIUM) return "premium";
  if (priceId === PRICE_PLUS) return "plus";
  return "free";
}
