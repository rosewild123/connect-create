// Built-in abusive content filter for chat messages.
// Curated, intentionally conservative list of slurs and abuse terms.
// Matching is case-insensitive, with leetspeak normalization, on word-ish boundaries
// to reduce false positives in normal words (e.g. "class", "assassin", "scunthorpe").

const BANNED_WORDS = [
  // Racial / ethnic slurs
  "nigger", "nigga", "chink", "spic", "kike", "gook", "wetback", "coon", "raghead", "paki",
  // Homophobic / transphobic slurs
  "faggot", "fag", "dyke", "tranny", "shemale",
  // Misogynistic / sexual slurs commonly used as abuse
  "cunt", "whore", "slut",
  // Ableist slurs
  "retard", "retarded",
  // Threats / extreme abuse
  "kys", "killyourself", "kill yourself",
  // CSAM-adjacent (zero tolerance)
  "cp", "childporn", "child porn", "loli", "shota", "underage",
];

// Map common leetspeak to letters for normalization
const LEET: Record<string, string> = {
  "0": "o", "1": "i", "!": "i", "3": "e", "4": "a", "@": "a",
  "5": "s", "$": "s", "7": "t", "8": "b", "9": "g",
};

function normalize(input: string): string {
  const lower = input.toLowerCase();
  let out = "";
  for (const ch of lower) out += LEET[ch] ?? ch;
  // Collapse repeated chars (e.g. "niiiger" -> "niger") and strip non-letters
  out = out.replace(/[^a-z ]+/g, " ").replace(/(.)\1{2,}/g, "$1$1");
  return out;
}

// Build regexes once. Use word boundaries; allow spaces inside multi-word entries.
const PATTERNS: RegExp[] = BANNED_WORDS.map((w) => {
  const norm = normalize(w).trim().replace(/\s+/g, "\\s*");
  return new RegExp(`(?:^|[^a-z])${norm}(?:$|[^a-z])`, "i");
});

export type FilterResult = {
  clean: boolean;
  matched: string[];
};

export function scanContent(raw: string): FilterResult {
  if (!raw) return { clean: true, matched: [] };
  const haystack = ` ${normalize(raw)} `;
  const matched: string[] = [];
  for (let i = 0; i < PATTERNS.length; i++) {
    if (PATTERNS[i].test(haystack)) matched.push(BANNED_WORDS[i]);
  }
  return { clean: matched.length === 0, matched };
}
