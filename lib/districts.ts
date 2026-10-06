// lib/districts.ts
//
// Static reference data for the arbitrage tool's MVP scope: the rice-growing
// districts of Andhra Pradesh and Telangana. This deliberately replaces a
// paid maps API (Google Maps / Mapbox) with a small, free, always-available
// lookup table + the Haversine formula — important for a public, no-login
// assistant that must keep working for strangers without a metered API key.
//
// Coordinates are approximate district-headquarters centroids, good enough
// to rank neighboring districts by relative distance for a decision-support
// tool — not survey-grade. Adjacency is a simplified "which districts
// commonly border/trade with this one" list, not an exhaustive GIS boundary
// computation. Both simplifications are documented as deliberate scope
// decisions in DOCUMENTATION.md.

export interface DistrictInfo {
  id: string; // slug, used as the canonical key
  name: string; // display name
  state: "Andhra Pradesh" | "Telangana";
  lat: number;
  lon: number;
  neighbors: string[]; // ids of neighboring districts considered for arbitrage
  // Reference (fallback) paddy price in INR per quintal (100 kg), common
  // variety. Used ONLY when a live price cannot be fetched/parsed. Sourced
  // as a rough approximation around India's common-paddy MSP band — replace
  // with real Agmarknet averages before relying on this for real decisions.
  fallbackPricePerQuintal: number;
  verified: boolean; // true = neighbor list taken from an official government district page
}

// Paddy (Common) Minimum Support Price, marketing season 2025-26, Government of India.
// Source: PIB, Cabinet approves MSP for Kharif crops 2025-26 — https://www.pib.gov.in/PressReleasePage.aspx?PRID=2131983
export const MSP_PADDY_COMMON_2025_26 = 2369;

export const DISTRICTS: DistrictInfo[] = [
  {
    id: "east-godavari",
    name: "East Godavari (Kakinada/Rajahmundry)",
    state: "Andhra Pradesh",
    lat: 17.0005,
    lon: 81.804,
    neighbors: ["west-godavari", "khammam"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "west-godavari",
    name: "West Godavari (Eluru)",
    state: "Andhra Pradesh",
    lat: 16.7107,
    lon: 81.0955,
    neighbors: ["east-godavari", "krishna"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: true,
  },
  {
    id: "krishna",
    name: "Krishna (Machilipatnam)",
    state: "Andhra Pradesh",
    lat: 16.1875,
    lon: 81.1389,
    neighbors: ["west-godavari", "guntur", "nalgonda", "khammam"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: true,
  },
  {
    id: "ntr-vijayawada",
    name: "NTR (Vijayawada)",
    state: "Andhra Pradesh",
    lat: 16.5062,
    lon: 80.648,
    neighbors: ["krishna", "guntur", "nalgonda"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "guntur",
    name: "Guntur",
    state: "Andhra Pradesh",
    lat: 16.3067,
    lon: 80.4365,
    neighbors: ["krishna", "palnadu", "bapatla"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: true,
  },
  {
    id: "prakasam",
    name: "Prakasam (Ongole)",
    state: "Andhra Pradesh",
    lat: 15.5057,
    lon: 80.0499,
    neighbors: ["bapatla", "palnadu", "nellore", "kadapa"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: true,
  },
  {
    id: "nellore",
    name: "SPSR Nellore",
    state: "Andhra Pradesh",
    lat: 14.4426,
    lon: 79.9865,
    neighbors: ["prakasam", "tirupati", "kadapa"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: true,
  },
  {
    id: "kadapa",
    name: "YSR Kadapa",
    state: "Andhra Pradesh",
    lat: 14.4673,
    lon: 78.8242,
    neighbors: ["prakasam", "nellore"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "nizamabad",
    name: "Nizamabad",
    state: "Telangana",
    lat: 18.6725,
    lon: 78.0941,
    neighbors: ["nirmal", "jagtial", "kamareddy"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: true,
  },
  {
    id: "kamareddy",
    name: "Kamareddy",
    state: "Telangana",
    lat: 18.32,
    lon: 78.34,
    neighbors: ["nizamabad", "medak"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "medak",
    name: "Medak",
    state: "Telangana",
    lat: 18.045,
    lon: 78.27,
    neighbors: ["kamareddy", "nizamabad", "karimnagar"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "karimnagar",
    name: "Karimnagar",
    state: "Telangana",
    lat: 18.4386,
    lon: 79.1288,
    neighbors: ["warangal", "medak", "nizamabad", "adilabad"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: true,
  },
  {
    id: "warangal",
    name: "Warangal",
    state: "Telangana",
    lat: 17.9689,
    lon: 79.5941,
    neighbors: ["karimnagar", "khammam", "nalgonda", "suryapet"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "khammam",
    name: "Khammam",
    state: "Telangana",
    lat: 17.2473,
    lon: 80.1514,
    neighbors: ["warangal", "east-godavari", "west-godavari", "suryapet"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "nalgonda",
    name: "Nalgonda",
    state: "Telangana",
    lat: 17.0575,
    lon: 79.269,
    neighbors: ["suryapet", "warangal", "guntur", "ntr-vijayawada"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "suryapet",
    name: "Suryapet",
    state: "Telangana",
    lat: 17.14,
    lon: 79.62,
    neighbors: ["nalgonda", "khammam", "warangal", "krishna"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  // --- Remaining Andhra Pradesh districts ---
  {
    id: "srikakulam",
    name: "Srikakulam",
    state: "Andhra Pradesh",
    lat: 18.2949,
    lon: 83.8938,
    neighbors: ["vizianagaram"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: true,
  },
  {
    id: "parvathipuram-manyam",
    name: "Parvathipuram Manyam",
    state: "Andhra Pradesh",
    lat: 18.7825,
    lon: 83.4214,
    neighbors: ["srikakulam", "vizianagaram", "alluri-sitharama-raju"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "vizianagaram",
    name: "Vizianagaram",
    state: "Andhra Pradesh",
    lat: 18.1066,
    lon: 83.3956,
    neighbors: ["srikakulam", "visakhapatnam"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: true,
  },
  {
    id: "visakhapatnam",
    name: "Visakhapatnam",
    state: "Andhra Pradesh",
    lat: 17.6868,
    lon: 83.2185,
    neighbors: ["vizianagaram", "anakapalli", "alluri-sitharama-raju"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "anakapalli",
    name: "Anakapalli",
    state: "Andhra Pradesh",
    lat: 17.6913,
    lon: 83.0055,
    neighbors: ["visakhapatnam", "alluri-sitharama-raju", "east-godavari"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "alluri-sitharama-raju",
    name: "Alluri Sitharama Raju",
    state: "Andhra Pradesh",
    lat: 17.9,
    lon: 82.65,
    neighbors: ["visakhapatnam", "anakapalli", "east-godavari", "parvathipuram-manyam"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "konaseema",
    name: "Konaseema (Amalapuram)",
    state: "Andhra Pradesh",
    lat: 16.5767,
    lon: 82.0061,
    neighbors: ["east-godavari", "west-godavari"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "palnadu",
    name: "Palnadu (Narasaraopet)",
    state: "Andhra Pradesh",
    lat: 16.2353,
    lon: 80.0494,
    neighbors: ["guntur", "prakasam", "bapatla", "ntr-vijayawada"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "bapatla",
    name: "Bapatla",
    state: "Andhra Pradesh",
    lat: 15.9044,
    lon: 80.4667,
    neighbors: ["guntur", "prakasam", "palnadu", "krishna"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "kurnool",
    name: "Kurnool",
    state: "Andhra Pradesh",
    lat: 15.8281,
    lon: 78.0373,
    neighbors: ["mahabubnagar", "anantapur", "nandyal"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: true,
  },
  {
    id: "nandyal",
    name: "Nandyal",
    state: "Andhra Pradesh",
    lat: 15.4786,
    lon: 78.4836,
    neighbors: ["mahabubnagar", "kadapa", "anantapur", "kurnool", "prakasam"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: true,
  },
  {
    id: "anantapur",
    name: "Anantapur",
    state: "Andhra Pradesh",
    lat: 14.6819,
    lon: 77.6006,
    neighbors: ["kurnool", "kadapa", "sri-sathya-sai", "chittoor"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "sri-sathya-sai",
    name: "Sri Sathya Sai (Puttaparthi)",
    state: "Andhra Pradesh",
    lat: 14.1685,
    lon: 77.81,
    neighbors: ["anantapur", "kadapa", "annamayya", "chittoor"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "annamayya",
    name: "Annamayya (Rayachoti)",
    state: "Andhra Pradesh",
    lat: 14.0517,
    lon: 78.7573,
    neighbors: ["kadapa", "chittoor", "anantapur", "nellore"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: true,
  },
  {
    id: "chittoor",
    name: "Chittoor",
    state: "Andhra Pradesh",
    lat: 13.2172,
    lon: 79.1003,
    neighbors: ["annamayya", "tirupati", "sri-sathya-sai"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "tirupati",
    name: "Tirupati",
    state: "Andhra Pradesh",
    lat: 13.6288,
    lon: 79.4192,
    neighbors: ["annamayya", "chittoor", "nellore"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: true,
  },
  // --- Remaining Telangana districts ---
  {
    id: "adilabad",
    name: "Adilabad",
    state: "Telangana",
    lat: 19.6641,
    lon: 78.532,
    neighbors: ["komaram-bheem-asifabad", "mancherial", "nirmal"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: true,
  },
  {
    id: "komaram-bheem-asifabad",
    name: "Komaram Bheem Asifabad",
    state: "Telangana",
    lat: 19.364,
    lon: 79.2855,
    neighbors: ["adilabad", "mancherial"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "mancherial",
    name: "Mancherial",
    state: "Telangana",
    lat: 18.876,
    lon: 79.4601,
    neighbors: ["adilabad", "komaram-bheem-asifabad", "jagtial", "peddapalli"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "nirmal",
    name: "Nirmal",
    state: "Telangana",
    lat: 19.0962,
    lon: 78.3445,
    neighbors: ["adilabad", "nizamabad", "jagtial"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "jagtial",
    name: "Jagtial",
    state: "Telangana",
    lat: 18.7906,
    lon: 78.9129,
    neighbors: ["nirmal", "karimnagar", "peddapalli", "mancherial", "nizamabad", "rajanna-sircilla"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "peddapalli",
    name: "Peddapalli",
    state: "Telangana",
    lat: 18.6155,
    lon: 79.3876,
    neighbors: ["karimnagar", "mancherial", "jayashankar-bhupalpally", "rajanna-sircilla", "jagtial"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "rajanna-sircilla",
    name: "Rajanna Sircilla",
    state: "Telangana",
    lat: 18.3883,
    lon: 78.8258,
    neighbors: ["karimnagar", "jagtial", "nizamabad", "kamareddy", "siddipet"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "siddipet",
    name: "Siddipet",
    state: "Telangana",
    lat: 18.1018,
    lon: 78.852,
    neighbors: ["karimnagar", "medak", "rajanna-sircilla", "jangaon", "medchal-malkajgiri"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "jangaon",
    name: "Jangaon",
    state: "Telangana",
    lat: 17.7229,
    lon: 79.1516,
    neighbors: ["warangal", "karimnagar", "siddipet", "yadadri-bhuvanagiri", "jayashankar-bhupalpally"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "jayashankar-bhupalpally",
    name: "Jayashankar Bhupalpally",
    state: "Telangana",
    lat: 18.4306,
    lon: 79.8795,
    neighbors: ["warangal", "peddapalli", "mulugu", "karimnagar", "mahabubabad", "jangaon"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "mulugu",
    name: "Mulugu",
    state: "Telangana",
    lat: 17.6129,
    lon: 80.2065,
    neighbors: ["jayashankar-bhupalpally", "bhadradri-kothagudem", "mahabubabad", "warangal"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "mahabubabad",
    name: "Mahabubabad",
    state: "Telangana",
    lat: 17.6024,
    lon: 80.0013,
    neighbors: ["warangal", "khammam", "mulugu", "jayashankar-bhupalpally", "suryapet"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "bhadradri-kothagudem",
    name: "Bhadradri Kothagudem",
    state: "Telangana",
    lat: 17.5483,
    lon: 80.6168,
    neighbors: ["khammam", "mulugu", "mahabubabad", "west-godavari"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "yadadri-bhuvanagiri",
    name: "Yadadri Bhuvanagiri",
    state: "Telangana",
    lat: 17.5116,
    lon: 78.908,
    neighbors: ["nalgonda", "hyderabad", "jangaon", "warangal", "medchal-malkajgiri", "siddipet"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "hyderabad",
    name: "Hyderabad",
    state: "Telangana",
    lat: 17.385,
    lon: 78.4867,
    neighbors: ["medchal-malkajgiri", "ranga-reddy", "yadadri-bhuvanagiri"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "medchal-malkajgiri",
    name: "Medchal-Malkajgiri",
    state: "Telangana",
    lat: 17.629,
    lon: 78.485,
    neighbors: ["hyderabad", "sangareddy", "siddipet", "ranga-reddy", "medak", "yadadri-bhuvanagiri"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "ranga-reddy",
    name: "Ranga Reddy",
    state: "Telangana",
    lat: 17.3,
    lon: 78.3,
    neighbors: ["hyderabad", "medchal-malkajgiri", "vikarabad", "sangareddy", "mahabubnagar"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "vikarabad",
    name: "Vikarabad",
    state: "Telangana",
    lat: 17.3335,
    lon: 77.9046,
    neighbors: ["ranga-reddy", "sangareddy", "mahabubnagar", "narayanpet"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "sangareddy",
    name: "Sangareddy",
    state: "Telangana",
    lat: 17.6286,
    lon: 78.088,
    neighbors: ["medak", "kamareddy", "medchal-malkajgiri", "ranga-reddy", "vikarabad"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "mahabubnagar",
    name: "Mahabubnagar",
    state: "Telangana",
    lat: 16.7426,
    lon: 77.9914,
    neighbors: ["ranga-reddy", "vikarabad", "narayanpet", "jogulamba-gadwal", "nagarkurnool", "wanaparthy"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "nagarkurnool",
    name: "Nagarkurnool",
    state: "Telangana",
    lat: 16.483,
    lon: 78.3119,
    neighbors: ["mahabubnagar", "nalgonda", "suryapet", "kurnool", "jogulamba-gadwal", "wanaparthy"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "jogulamba-gadwal",
    name: "Jogulamba Gadwal",
    state: "Telangana",
    lat: 16.2335,
    lon: 77.8061,
    neighbors: ["mahabubnagar", "nagarkurnool", "kurnool", "narayanpet", "wanaparthy"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "narayanpet",
    name: "Narayanpet",
    state: "Telangana",
    lat: 16.7444,
    lon: 77.4958,
    neighbors: ["mahabubnagar", "vikarabad", "jogulamba-gadwal"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
  {
    id: "wanaparthy",
    name: "Wanaparthy",
    state: "Telangana",
    lat: 16.3616,
    lon: 78.0623,
    neighbors: ["mahabubnagar", "nagarkurnool", "kurnool", "jogulamba-gadwal"],
    fallbackPricePerQuintal: MSP_PADDY_COMMON_2025_26,
    verified: false,
  },
];

const BY_ID = new Map(DISTRICTS.map((d) => [d.id, d]));
// Lowercased name (and common short forms) -> id, for resolving free-text user input.
const NAME_INDEX = new Map<string, string>();
for (const d of DISTRICTS) {
  NAME_INDEX.set(d.id.replace(/-/g, " "), d.id);
  NAME_INDEX.set(d.name.toLowerCase(), d.id);
  // Also index the part before a parenthetical, e.g. "east godavari"
  const base = d.name.split("(")[0].trim().toLowerCase();
  NAME_INDEX.set(base, d.id);
}
// A few common aliases / alternate spellings.
const ALIASES: Record<string, string> = {
  vijayawada: "ntr-vijayawada",
  ntr: "ntr-vijayawada",
  kakinada: "east-godavari",
  rajahmundry: "east-godavari",
  eluru: "west-godavari",
  machilipatnam: "krishna",
  ongole: "prakasam",
  kadapa: "kadapa",
  cuddapah: "kadapa",
};
for (const [alias, id] of Object.entries(ALIASES)) NAME_INDEX.set(alias, id);

/** Resolve free-text district/city input (case-insensitive) to a DistrictInfo, or undefined. */
export function findDistrict(input: string): DistrictInfo | undefined {
  const key = input.trim().toLowerCase();
  const resolvedId = BY_ID.has(key) ? key : NAME_INDEX.get(key);
  return resolvedId ? BY_ID.get(resolvedId) : undefined;
}

export function districtById(id: string): DistrictInfo | undefined {
  return BY_ID.get(id);
}

export function neighborsOf(d: DistrictInfo): DistrictInfo[] {
  return d.neighbors.map((id) => BY_ID.get(id)).filter((x): x is DistrictInfo => !!x);
}

/** Straight-line distance in km between two lat/lon points (Haversine formula). */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius, km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Straight-line distance underestimates real road distance (roads aren't
// straight lines). This fixed fudge factor approximates typical Indian
// district-road routing without needing a paid directions API. Documented
// as a known simplification in DOCUMENTATION.md.
export const ROAD_DISTANCE_FACTOR = 1.35;

/** Road-distance estimate in km between two districts. */
export function roadDistanceKm(a: DistrictInfo, b: DistrictInfo): number {
  if (a.id === b.id) return 0;
  return haversineKm(a.lat, a.lon, b.lat, b.lon) * ROAD_DISTANCE_FACTOR;
}

// When the seeded fallbackPricePerQuintal values above were last manually set.
// Used to compute a real age for fallback price quotes instead of stamping
// them with today's date — see app/api/chat/tools/arbitrage.ts PriceQuote.
export const FALLBACK_DATASET_AS_OF = "2026-09-05";

export const DISTANCE_METHODOLOGY_NOTE =
  `Distance is estimated from straight-line coordinates between district centers, multiplied by a fixed ${ROAD_DISTANCE_FACTOR}x factor to approximate road routing — not a turn-by-turn route, and it can differ from the real distance for a specific pair of towns.`;

export const ADJACENCY_METHODOLOGY_NOTE =
  "Neighboring districts are a hand-curated list, not a computed GIS boundary check — a small number of genuine neighbors may be missing.";

/** All district display names, for prompt guidance / error messages. */
export const DISTRICT_NAMES = DISTRICTS.map((d) => d.name);
