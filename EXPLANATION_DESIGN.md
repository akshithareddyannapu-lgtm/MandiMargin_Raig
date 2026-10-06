# EXPLANATION_DESIGN.md — MandiMargin

A Responsible AI & Governance coursework deliverable, built on the `mandimargin-raig` copy of MandiMargin. Topic: **Transparency and Explanation Design** (`raig_group 4 topic.pdf`, item 16).

## 1. Framing

The topic brief frames the core decision as: *"who needs an explanation, what they need to understand, and when."* Its own worked example is the closest real-world analogue to this product: *"A compliance analyst sees a recommendation to escalate a transaction but receives only a confidence score. The analyst needs to know which evidence influenced the recommendation and what information is missing."*

MandiMargin's `arbitrageCalculator` is a direct instance of the same problem. It recommends which district a merchant should ship paddy/rice to, and that recommendation drives a real financial decision — a truck gets loaded or it doesn't. Before this work, the product gave the merchant a number and one line about "live vs. reference" pricing. It did not tell them *how much to trust* that number, *whether the gain was meaningful*, or *how* the number was actually produced.

## 2. The two real gaps

These come from the team's own field test with 14 real rice mill owners and merchants (`DOCUMENTATION.md`, C6), not a hypothetical:

- **Test #5 (Nellore).** A live price fetch failed, so the tool fell back to reference data. The merchant called the mandi directly and found a real ₹250/quintal gap. Quote from C6: *"Prices are old. I cannot trust this for real decisions."* He did not ship. Root cause, found while building this feature: the fallback price's `asOf` field was stamped with **today's date**, even though the number itself is a static seed value — so the existing "ref." tag never actually revealed how old the figure was.
- **Test #9 (Srikakulam).** The recommended district was only ₹50/quintal better than staying local, for a 45 km trip. The merchant had no way to judge whether that was a real gain or noise, and stayed local rather than risk it. Nothing in the product distinguished "clearly worth it" from "barely better."

## 3. Who needs what, when — the layering model

| Layer | What it shows | Who it's for | Why this placement |
|---|---|---|---|
| Quick-glance badges | A recommendation-strength badge ("Worth the trip" / "Marginal" / "Stay local") right under the headline, and a per-price confidence badge ("Live" / "Ref · 1d old" / "Stale ref.") in the comparison table | The busy merchant deciding in the moment — MandiMargin's primary persona (A2) | Zero clicks. This is the fast path most users need, and it's the layer test #9's merchant was missing entirely. |
| Comparison table | The existing per-district grid, now carrying the confidence badges | Anyone scanning more than one option | Unchanged location — this table was already the product's core UI; the badges ride on it rather than adding a new surface. |
| "i" info popup | The real arithmetic for one specific district, price provenance, methodology notes, and a link to confirm the price at its source | A merchant who wants to double-check one number before committing — or exactly the test #5 scenario, where the merchant's instinct to verify was correct but the product gave them no easy way to do it in-app | On demand, per option, so it never competes with the quick-glance layer. |
| "How this was calculated" / "What this doesn't account for" accordion | General methodology (pricing, distance, adjacency) and the full list of known limitations | A more deliberate user comparing scenarios — e.g. test #8's co-op manager, who ran the tool twice with different quantities before committing a real shipment | Collapsed by default, once per card (not per option) — this is background reading, not a decision input. |
| Elevated staleness banner | A visible warning above the option list when the data behind the *recommended* option is aging or stale | Everyone, automatically, specifically when the usual badges aren't enough | Test #5's failure was that an equivalent sentence already existed — in the footer, where it evidently wasn't salient enough. This banner moves above the fold exactly when the signal matters most. |

## 4. Feature-to-gap mapping

| New feature | Addresses | Mechanism |
|---|---|---|
| `PriceQuote.ageDays` / `confidenceTier`, fallback `asOf` fixed to a real seed date | Test #5 | Fallback quotes are no longer silently stamped "today" — the badge and popup both show a real age. |
| Per-price confidence badge + tooltip | Test #5 | Surfaces live/aging/stale at a glance, in the table itself, not just the footer. |
| Elevated data-confidence banner | Test #5 | Moves the warning above the option list when it matters, instead of a footer line nobody read. |
| `recommendationStrength` + badge/sentence | Test #9 | Directly answers "is this worth the trip" without the merchant having to do the mental math themselves. |
| "i" info popup with real arithmetic + confirm link | Test #5 and Test #9 | Lets a skeptical merchant check the exact numbers and go verify the price themselves, in one click. |
| Accordion (methodology + limitations) | Both, for the deliberate-user persona (test #8) | Full disclosure of what the tool does and doesn't account for, without cluttering the primary view. |

## 5. The two algorithms

**Confidence tier** — `fresh` (same day), `aging` (1 day old), `stale` (2+ days old). Mandi prices are set once per trading day, so same-day is the only case that deserves unqualified "live" treatment. The `aging` bucket (exactly 1 day) is sized specifically to catch test #5's scenario — the ~12–24 hour window where that merchant's trust broke — rather than lumping it in with "fresh."

**Recommendation strength** — `"none"` if the uplift vs. staying local is ≤ ₹0; `"strong"` if the uplift is ≥ ₹500 **and** ≥ ₹20/quintal; otherwise `"marginal"`. The ₹20/quintal floor is anchored to test #6 (Karimnagar), where the *recommended district itself* flipped within a single hour from ordinary price movement — direct field evidence that gaps near that size are inside the tool's own day-to-day noise, not a real signal. The ₹500 absolute floor stops a small shipment with a high freight rate from reading as "strong" on per-quintal math alone. Test #9's ₹50 uplift lands well under both floors → `"marginal"`, the exact missing signal; test #1's ₹900/12 quintals (≈₹75/quintal) clears both → `"strong"`, matching its real "Success" outcome.

## 6. Deliberate scope cuts

The accordion's "what this doesn't account for" list is itself part of the explanation, not an afterthought: grading/moisture/variety (one reference price per district regardless of quality), mandi commission and handling fees (the net-profit figure is price minus freight only), and real road routing (distance is a straight-line estimate × a fixed factor, not a turn-by-turn route). None of these are hidden — disclosing a model's boundaries is as much a transparency requirement as explaining what it did compute.

## 7. Fit with the existing design philosophy

MandiMargin's existing architecture already treats the result card as the deterministic, authoritative channel and the model's prose as reinforcement, not the source of truth (see `DOCUMENTATION.md` C1/C5). This work keeps that split: every new signal (`recommendationStrength`, `dataConfidence`, the popup's numbers) is computed once in `arbitrageCalculator` and rendered deterministically in `ArbitrageCard`; the one addition to `prompts.ts` only asks the model to restate the same card-computed signals in its own words, never to compute or override them.

## 8. Self-aware limitation

`FALLBACK_DATASET_AS_OF` is a single global date for the entire seeded price dataset, not tracked per district. If the fallback prices for different districts were actually set at different times, this would understate the true age for some and overstate it for others. A per-district `fallbackAsOf` field would be the natural next step — this version chose the simpler global date because it was verifiable (via `git log` on `lib/districts.ts`) rather than guessed.
