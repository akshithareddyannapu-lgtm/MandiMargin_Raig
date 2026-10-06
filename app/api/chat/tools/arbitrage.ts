// app/api/chat/tools/arbitrage.ts
//
// MandiMargin's core feature: given an origin district, a paddy/rice
// quantity, and a per-km freight rate, rank the origin plus its neighboring
// districts by NET profit after freight and recommend the best one.
//
//   netProfit = pricePerKg * quantityKg - freightPerKm * distanceKm
//
// (the same formula the team's original brief specified, restated per-kg).
//
// Price sourcing: tries a live Exa fetch against Agmarknet / state mandi
// board pages for each district and heuristically extracts a rupees-per-
// quintal figure from the page text. If no plausible number is found (page
// blocked, paywalled, layout changed, network error, etc.) it falls back to
// a small pre-seeded reference dataset (lib/districts.ts) so the tool NEVER
// fails or fabricates a number — it just labels the figure "reference" and
// says so, which the system prompt requires the model to surface to the user.
import { tool } from "ai";
import { z } from "zod";
import { getExa, domainOf } from "./web-search";
import {
  DISTRICTS,
  DISTRICT_NAMES,
  findDistrict,
  neighborsOf,
  roadDistanceKm,
  FALLBACK_DATASET_AS_OF,
  type DistrictInfo,
} from "@/lib/districts";
import { EXA_MAX_CHARACTERS } from "@/config";
import type { UISource } from "@/types/data";

// Sanity band for extracted prices (INR per quintal of paddy/rice). Anything
// outside this band is almost certainly a mis-parse (a date, a phone number,
// an unrelated rupee figure on the page) — reject it and fall back instead
// of showing the user a nonsense number.
const PLAUSIBLE_MIN_PRICE = 1200;
const PLAUSIBLE_MAX_PRICE = 5500;

export interface PriceQuote {
  pricePerQuintal: number;
  live: boolean; // true = parsed from a live fetch; false = reference/fallback dataset
  sourceTitle: string;
  sourceUrl: string;
  asOf: string; // ISO date string
  ageDays: number; // days between `asOf` and now
  confidenceTier: "fresh" | "aging" | "stale"; // same day / 1 day old / 2+ days old
  fallbackReason?: "fetch-error" | "no-parseable-price"; // only set when live === false
}

export interface ArbitrageOption {
  districtId: string;
  districtName: string;
  isOrigin: boolean;
  distanceKm: number;
  price: PriceQuote;
  freightCost: number;
  grossRevenue: number;
  netProfit: number;
}

export interface ArbitrageResult {
  originDistrict: string;
  quantityKg: number;
  freightPerKm: number;
  generatedAt: string;
  options: ArbitrageOption[];
  recommendedDistrictId: string;
  upliftVsOrigin: number;
  upliftPerQuintal: number;
  recommendationStrength: "strong" | "marginal" | "none";
  dataConfidence: "fresh" | "aging" | "stale";
}

// Static explanation content (not per-request data) surfaced in the result
// card's "how this was calculated" disclosure — see components/messages/arbitrage-card.tsx.
export const PRICING_METHODOLOGY_NOTE =
  "Prices are found by searching mandi/Agmarknet listings for each district and extracting a rupees-per-quintal figure in the ₹1,200–5,500 band. If no such figure can be reliably extracted, the tool falls back to a seeded reference dataset rather than guessing.";

function ageDaysOf(asOfISODate: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(asOfISODate).getTime()) / 86_400_000));
}

function confidenceTierOf(ageDays: number): "fresh" | "aging" | "stale" {
  if (ageDays <= 0) return "fresh";
  if (ageDays === 1) return "aging";
  return "stale";
}

// A recommendation is only as good as the merchant's ability to tell whether
// the gain is real or within the market's normal day-to-day noise. Thresholds
// are anchored to the team's 14-merchant field test (DOCUMENTATION.md C6):
// test #6 showed the "best" district itself flipping within one hour from
// ordinary price movement, so gaps near ₹20/quintal are inside that noise
// band; test #9's ₹50 total uplift (well under both floors here) is exactly
// the case a merchant couldn't judge without this signal.
const MARGINAL_ABS_THRESHOLD_INR = 500;
const MARGINAL_PER_QUINTAL_THRESHOLD_INR = 20;

function recommendationStrengthOf(
  upliftVsOrigin: number,
  upliftPerQuintal: number
): "strong" | "marginal" | "none" {
  if (upliftVsOrigin <= 0) return "none";
  if (upliftVsOrigin >= MARGINAL_ABS_THRESHOLD_INR && upliftPerQuintal >= MARGINAL_PER_QUINTAL_THRESHOLD_INR) {
    return "strong";
  }
  return "marginal";
}

// Worse of two confidence tiers (fresh < aging < stale).
function worseTier(
  a: "fresh" | "aging" | "stale",
  b: "fresh" | "aging" | "stale"
): "fresh" | "aging" | "stale" {
  const order = { fresh: 0, aging: 1, stale: 2 } as const;
  return order[a] >= order[b] ? a : b;
}

function extractPricePerQuintal(text: string): number | null {
  if (!text) return null;
  // Look for "<number> per quintal / per qtl / /quintal" style mentions,
  // optionally preceded by ₹ or Rs. Numbers may contain commas.
  const patterns = [
    /(?:₹|rs\.?|inr)\s?([\d,]{3,7})\s*(?:\/|per)\s*(?:quintal|qtl|q\.)/gi,
    /([\d,]{3,7})\s*(?:\/|per)\s*(?:quintal|qtl|q\.)/gi,
  ];
  for (const re of patterns) {
    const matches = [...text.matchAll(re)];
    for (const m of matches) {
      const n = Number(m[1].replace(/,/g, ""));
      if (Number.isFinite(n) && n >= PLAUSIBLE_MIN_PRICE && n <= PLAUSIBLE_MAX_PRICE) {
        return n;
      }
    }
  }
  return null;
}

function fallbackQuote(
  district: DistrictInfo,
  reason: "fetch-error" | "no-parseable-price"
): PriceQuote {
  // FALLBACK_DATASET_AS_OF, not today — these are static seed prices, and
  // stamping them with the current date was the exact bug behind a real
  // trust failure in the team's field test (DOCUMENTATION.md C6, test #5):
  // the "ref." tag existed, but the date next to it never revealed how old
  // the number actually was.
  const ageDays = ageDaysOf(FALLBACK_DATASET_AS_OF);
  return {
    pricePerQuintal: district.fallbackPricePerQuintal,
    live: false,
    sourceTitle: "Reference price (not live — sample dataset)",
    sourceUrl: "",
    asOf: FALLBACK_DATASET_AS_OF,
    ageDays,
    confidenceTier: confidenceTierOf(ageDays),
    fallbackReason: reason,
  };
}

async function fetchLivePrice(district: DistrictInfo): Promise<PriceQuote> {
  try {
    const exa = getExa();
    const response = (await exa.search(
      `${district.name} district paddy rice mandi price today per quintal Agmarknet`,
      {
        type: "auto",
        numResults: 3,
        livecrawl: "preferred",
        contents: { text: { maxCharacters: EXA_MAX_CHARACTERS } },
      } as any
    )) as any;
    const results: any[] = response?.results || [];
    for (const r of results) {
      if (!r.url) continue;
      const text: string = r.text || "";
      const price = extractPricePerQuintal(text);
      if (price) {
        const asOf = (r.publishedDate || new Date().toISOString()).slice(0, 10);
        const ageDays = ageDaysOf(asOf);
        return {
          pricePerQuintal: price,
          live: true,
          sourceTitle: r.title || domainOf(r.url),
          sourceUrl: r.url,
          asOf,
          ageDays,
          confidenceTier: confidenceTierOf(ageDays),
        };
      }
    }
    return fallbackQuote(district, "no-parseable-price");
  } catch (error) {
    console.error(`arbitrage: price fetch failed for ${district.name}:`, error);
    return fallbackQuote(district, "fetch-error");
  }
}

export function createArbitrageCalculator(collect: (s: UISource, content?: string) => void) {
  return tool({
    description:
      "Calculate net profit for selling paddy/rice at the origin district vs. neighboring districts in Andhra Pradesh or Telangana, after netting out freight cost, and recommend the destination with the highest net profit. " +
      "Call this whenever the user gives (or you can confirm) an origin district, a quantity of rice/paddy, and a transport/freight cost per km. " +
      "If any of the three inputs is missing or ambiguous, ASK the user for it instead of guessing — never invent a quantity or freight rate. " +
      `Supported districts (Andhra Pradesh & Telangana rice belt only): ${DISTRICT_NAMES.join(", ")}. ` +
      "If the user's location is outside this list or outside AP/Telangana, say this tool only covers the AP/Telangana rice belt for now and do not call the tool.",
    inputSchema: z.object({
      originDistrict: z
        .string()
        .describe(
          "The merchant's current district (e.g. 'Guntur', 'Nizamabad'). Must be one of the supported AP/Telangana districts."
        ),
      quantityKg: z
        .number()
        .positive()
        .describe("Quantity of paddy/rice the merchant has to sell, in kilograms."),
      freightPerKm: z
        .number()
        .nonnegative()
        .describe(
          "Transport cost in INR per kilometer for the shipment (the truck/trip rate, not per kg)."
        ),
    }),
    execute: async ({ originDistrict, quantityKg, freightPerKm }) => {
      const origin = findDistrict(originDistrict);
      if (!origin) {
        return {
          error: `"${originDistrict}" is not a recognized district in this tool's AP/Telangana coverage. Supported districts: ${DISTRICT_NAMES.join(", ")}.`,
        };
      }

      const candidates = [origin, ...neighborsOf(origin)];
      const options: ArbitrageOption[] = await Promise.all(
        candidates.map(async (d) => {
          const distanceKm = roadDistanceKm(origin, d);
          const price = await fetchLivePrice(d);
          if (price.live && price.sourceUrl) {
            collect(
              {
                kind: "web",
                title: price.sourceTitle,
                url: price.sourceUrl,
                site: domainOf(price.sourceUrl),
                publishedDate: price.asOf,
              },
              `${d.name} paddy price: ~₹${price.pricePerQuintal}/quintal (as of ${price.asOf})`
            );
          }
          const pricePerKg = price.pricePerQuintal / 100;
          const grossRevenue = pricePerKg * quantityKg;
          const freightCost = freightPerKm * distanceKm;
          const netProfit = grossRevenue - freightCost;
          return {
            districtId: d.id,
            districtName: d.name,
            isOrigin: d.id === origin.id,
            distanceKm: Math.round(distanceKm * 10) / 10,
            price,
            freightCost: Math.round(freightCost),
            grossRevenue: Math.round(grossRevenue),
            netProfit: Math.round(netProfit),
          };
        })
      );

      options.sort((a, b) => b.netProfit - a.netProfit);
      const best = options[0];
      const originOption = options.find((o) => o.isOrigin)!;

      const upliftVsOrigin = best.netProfit - originOption.netProfit;
      const upliftPerQuintal = upliftVsOrigin / (quantityKg / 100);

      const result: ArbitrageResult = {
        originDistrict: origin.name,
        quantityKg,
        freightPerKm,
        generatedAt: new Date().toISOString(),
        options,
        recommendedDistrictId: best.districtId,
        upliftVsOrigin,
        upliftPerQuintal,
        recommendationStrength: recommendationStrengthOf(upliftVsOrigin, upliftPerQuintal),
        dataConfidence: worseTier(originOption.price.confidenceTier, best.price.confidenceTier),
      };
      return result;
    },
  });
}
