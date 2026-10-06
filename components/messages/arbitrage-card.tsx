"use client";

// Result-card / comparison-table UI for the arbitrageCalculator tool.
// Renders the tool's structured JSON output deterministically — independent
// of the model's prose — the same pattern the template already uses for the
// Sources box (see types/data.ts, components/messages/sources.tsx). This is
// the feature's "new UI element" half; the tool itself is the "new tool"
// half (see AGENTS.md's two required feature types).
//
// Explanation-design additions (Responsible AI & Governance coursework):
// a confidence badge per price, a recommendation-strength signal, an
// elevated staleness banner, and a per-option "i" info popup with the real
// calculation and a link to confirm the price at its source. Grounded in
// two real gaps from the team's 14-merchant field test (DOCUMENTATION.md,
// C6): test #5 (stale fallback price mistaken for current) and test #9
// (no way to tell if a small uplift was worth the trip). See
// EXPLANATION_DESIGN.md for the full rationale.

import { TrendingUp, Truck, MapPin, Info } from "lucide-react";
import type { ArbitrageOption, ArbitrageResult, PriceQuote } from "@/app/api/chat/tools/arbitrage";
import { PRICING_METHODOLOGY_NOTE } from "@/app/api/chat/tools/arbitrage";
import { DISTANCE_METHODOLOGY_NOTE, ADJACENCY_METHODOLOGY_NOTE } from "@/lib/districts";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

function formatINR(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

// Agmarknet's own site has no simple per-district lookup URL, so the
// "confirm this price" link points to a search a merchant can actually use
// rather than a constructed deep link that might not resolve.
function confirmPriceUrl(price: PriceQuote, districtName: string): string {
  if (price.live && price.sourceUrl) return price.sourceUrl;
  return `https://www.google.com/search?q=${encodeURIComponent(`${districtName} mandi paddy rice price today Agmarknet`)}`;
}

function priceBadgeProps(price: PriceQuote): { label: string; variant: "outline" | "secondary" | "destructive"; className?: string } {
  const prefix = price.live ? "Live" : "Ref.";
  if (price.confidenceTier === "fresh") {
    return { label: prefix, variant: price.live ? "outline" : "secondary" };
  }
  if (price.confidenceTier === "aging") {
    return {
      label: `${prefix} · 1d old`,
      variant: "secondary",
      className: "bg-warning text-warning-foreground border-transparent",
    };
  }
  return { label: `${prefix} · ${price.ageDays}d old`, variant: "destructive" };
}

function OptionInfoDialog({
  option,
  freightPerKm,
  quantityKg,
  generatedAt,
}: {
  option: ArbitrageOption;
  freightPerKm: number;
  quantityKg: number;
  generatedAt: string;
}) {
  const quintals = quantityKg / 100;
  const quintalsLabel = Number.isInteger(quintals) ? quintals.toString() : quintals.toFixed(1);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`How the ${option.districtName} figures were calculated`}
          className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent size-5 shrink-0 transition-colors"
        >
          <Info className="size-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{option.districtName} — how this was calculated</DialogTitle>
          <DialogDescription>
            Generated {new Date(generatedAt).toLocaleString("en-IN")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 text-sm">
          <div className="rounded-md border bg-muted/40 p-3 font-mono text-xs leading-relaxed">
            {formatINR(option.price.pricePerQuintal)}/qtl ÷ 100 × {quantityKg.toLocaleString("en-IN")} kg ({quintalsLabel} qtl)
            <br />
            − {formatINR(freightPerKm)}/km × {option.distanceKm} km
            <br />
            <span className="font-semibold">= {formatINR(option.netProfit)} net profit</span>
          </div>

          <div>
            <div className="font-medium mb-1">Price source</div>
            <p className="text-muted-foreground">
              {option.price.live
                ? `Fetched live from ${option.price.sourceTitle}, dated ${option.price.asOf} (${option.price.ageDays === 0 ? "today" : `${option.price.ageDays} day(s) ago`}).`
                : `Reference price from the app's seeded dataset, last set ${option.price.asOf} — ${
                    option.price.fallbackReason === "fetch-error"
                      ? "a live fetch could not be completed"
                      : "no usable price could be found on live sources"
                  }.`}
            </p>
          </div>

          <div>
            <div className="font-medium mb-1">Distance &amp; neighbors</div>
            <p className="text-muted-foreground">{DISTANCE_METHODOLOGY_NOTE}</p>
            <p className="text-muted-foreground mt-1">{ADJACENCY_METHODOLOGY_NOTE}</p>
          </div>

          <div>
            <div className="font-medium mb-1">How prices are found</div>
            <p className="text-muted-foreground">{PRICING_METHODOLOGY_NOTE}</p>
          </div>

          <a
            href={confirmPriceUrl(option.price, option.districtName)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 text-sm font-medium"
          >
            Confirm this price →
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OptionRow({
  option,
  isBest,
  freightPerKm,
  quantityKg,
  generatedAt,
}: {
  option: ArbitrageOption;
  isBest: boolean;
  freightPerKm: number;
  quantityKg: number;
  generatedAt: string;
}) {
  const badge = priceBadgeProps(option.price);

  return (
    <div
      className={`grid grid-cols-[1fr_auto] sm:grid-cols-[1.4fr_repeat(4,1fr)] gap-x-4 gap-y-1 items-center rounded-lg border px-3 py-2.5 text-sm ${
        isBest
          ? "border-primary/50 bg-primary/10"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-center gap-1.5 font-medium min-w-0">
        <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{option.districtName}</span>
        {option.isOrigin && (
          <span className="text-[10px] text-muted-foreground border rounded px-1 shrink-0">origin</span>
        )}
        {isBest && (
          <span className="text-[10px] text-primary font-semibold shrink-0">
            BEST
          </span>
        )}
        <OptionInfoDialog
          option={option}
          freightPerKm={freightPerKm}
          quantityKg={quantityKg}
          generatedAt={generatedAt}
        />
      </div>
      <div className="hidden sm:block text-muted-foreground">
        {option.distanceKm === 0 ? "local" : `${option.distanceKm} km`}
      </div>
      <div className="hidden sm:flex items-center gap-1 text-muted-foreground">
        {formatINR(option.price.pricePerQuintal)}/qtl
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={badge.variant} className={`${badge.className ?? ""} cursor-default`}>
              {badge.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {option.price.live ? "Fetched live" : "Reference price"} — as of {option.price.asOf}
            {option.price.fallbackReason ? ` (${option.price.fallbackReason === "fetch-error" ? "live fetch failed" : "no parseable price found"})` : ""}
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="hidden sm:block text-muted-foreground">
        −{formatINR(option.freightCost)} freight
      </div>
      <div
        className={`text-right font-semibold ${isBest ? "text-primary" : ""}`}
      >
        {formatINR(option.netProfit)}
      </div>
      {/* Mobile-only compact detail line */}
      <div className="col-span-2 sm:hidden text-xs text-muted-foreground">
        {(option.distanceKm === 0 ? "local" : `${option.distanceKm} km`)} · {formatINR(option.price.pricePerQuintal)}/qtl ({badge.label}) · −{formatINR(option.freightCost)} freight
      </div>
    </div>
  );
}

const STRENGTH_CONFIG = {
  strong: {
    badge: "Worth the trip",
    badgeClassName: "bg-success text-success-foreground border-transparent",
  },
  marginal: {
    badge: "Marginal",
    badgeClassName: "bg-warning text-warning-foreground border-transparent",
  },
  none: {
    badge: "Stay local",
    badgeClassName: "",
  },
} as const;

function strengthSentence(data: ArbitrageResult, best: ArbitrageOption): string | null {
  if (data.recommendationStrength === "strong") return null; // badge alone is enough
  if (data.recommendationStrength === "none") {
    return "Your own district is already the best net-profit option today.";
  }
  return `Only ${formatINR(data.upliftVsOrigin)} more than staying local — within normal day-to-day price movement. Weigh that against a ${best.distanceKm} km trip.`;
}

function confidenceBanner(data: ArbitrageResult): { text: string; className: string } | null {
  if (data.dataConfidence === "fresh") return null; // nothing extra to say beyond the per-price badges
  if (data.dataConfidence === "aging") {
    return {
      text: "Prices shown are about a day old, not fetched live right now — confirm before shipping.",
      className: "bg-warning/15 border border-warning/40 text-warning-foreground",
    };
  }
  return {
    text: "Live prices could not be fetched. Reference data shown may be several days old — confirm today's price at the mandi before committing this shipment.",
    className: "bg-destructive/10 border border-destructive/30 text-destructive",
  };
}

export function ArbitrageCard({ data }: { data: ArbitrageResult | { error: string } }) {
  if ("error" in data) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
        {data.error}
      </div>
    );
  }

  const best = data.options.find((o) => o.districtId === data.recommendedDistrictId);
  if (!best) return null;

  const banner = confidenceBanner(data);
  const sentence = strengthSentence(data, best);
  const strength = STRENGTH_CONFIG[data.recommendationStrength];

  return (
    <div className="w-full rounded-xl border bg-card/50 p-3 flex flex-col gap-2.5">
      <div className="flex items-center gap-2 text-sm font-medium flex-wrap">
        <TrendingUp className="size-4 text-primary" />
        <span>
          Best option: <span className="text-primary">{best.districtName}</span>
        </span>
        <Badge className={strength.badgeClassName} variant={data.recommendationStrength === "none" ? "secondary" : "default"}>
          {strength.badge}
        </Badge>
        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <Truck className="size-3.5" />
          {formatINR(data.freightPerKm)}/km
        </span>
      </div>

      {sentence && <div className="text-xs text-muted-foreground -mt-1">{sentence}</div>}

      {banner && (
        <div className={`text-xs rounded-md px-2.5 py-1.5 ${banner.className}`}>{banner.text}</div>
      )}

      <div className="flex flex-col gap-1.5">
        {data.options.map((option) => (
          <OptionRow
            key={option.districtId}
            option={option}
            isBest={option.districtId === data.recommendedDistrictId}
            freightPerKm={data.freightPerKm}
            quantityKg={data.quantityKg}
            generatedAt={data.generatedAt}
          />
        ))}
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="methodology">
          <AccordionTrigger className="text-xs text-muted-foreground py-1.5 hover:no-underline">
            How this was calculated
          </AccordionTrigger>
          <AccordionContent className="text-xs text-muted-foreground flex flex-col gap-1.5">
            <p>{PRICING_METHODOLOGY_NOTE}</p>
            <p>{DISTANCE_METHODOLOGY_NOTE}</p>
            <p>{ADJACENCY_METHODOLOGY_NOTE}</p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="limitations" className="border-b-0">
          <AccordionTrigger className="text-xs text-muted-foreground py-1.5 hover:no-underline">
            What this doesn&apos;t account for
          </AccordionTrigger>
          <AccordionContent className="text-xs text-muted-foreground">
            <ul className="list-disc list-inside flex flex-col gap-1">
              <li>Grading, moisture content, or variety — one reference price per district regardless of paddy quality.</li>
              <li>Mandi commission, loading, or other handling fees — this is price minus freight only.</li>
              <li>Real road routing — distance is a straight-line estimate, not a turn-by-turn route.</li>
              <li>Today&apos;s figures only — prices can move within the day; always confirm before shipping.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
