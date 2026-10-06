import Link from "next/link";
import { ArrowLeftIcon, Calculator } from "lucide-react";
import { AI_NAME } from "@/config";
import { DISTRICTS } from "@/lib/districts";

const APP_DISTRICTS = DISTRICTS.filter((d) => d.state === "Andhra Pradesh");
const TG_DISTRICTS = DISTRICTS.filter((d) => d.state === "Telangana");

export default function About() {
  return (
    <div className="w-full min-h-screen bg-background flex justify-center px-4 py-10">
      <div className="w-full max-w-3xl space-y-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to the assistant
        </Link>

        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Rice arbitrage assistant</p>
          <h1 className="text-4xl font-bold text-foreground">{AI_NAME}</h1>
          <p className="text-lg text-muted-foreground">
            Find which nearby mandi gives you the best net profit for your paddy or rice, after freight — in under a minute.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Calculator className="w-4 h-4" />
            Start a check
          </Link>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">How it works</h2>
          <ol className="grid gap-3 sm:grid-cols-3">
            {[
              { title: "Tell us where you are", body: "Pick your district, how much paddy or rice you have, and your freight cost per km." },
              { title: "We compare the options", body: "The assistant checks today's mandi prices for your district and its neighbors, then nets out freight." },
              { title: "You decide, with the evidence", body: "Every price shows whether it is live or reference data, how old it is, and a link to confirm it yourself." },
            ].map((step, i) => (
              <li key={step.title} className="rounded-xl border bg-card p-4 space-y-2">
                <span className="inline-flex size-7 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-sm font-bold">
                  {i + 1}
                </span>
                <h3 className="font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">Where it works</h2>
          <p className="text-muted-foreground">
            Covers {DISTRICTS.length} districts across Andhra Pradesh and Telangana. Districts marked (unverified) do not yet have their neighbor list confirmed against an official government district page, so their comparisons are less reliable. Reference prices are the government's 2025-26 minimum support price for paddy, not live mandi prices.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-card p-4">
              <h3 className="font-semibold text-foreground mb-2">Andhra Pradesh ({APP_DISTRICTS.length})</h3>
              <ul className="text-sm text-muted-foreground grid grid-cols-2 gap-x-3 gap-y-1">
                {APP_DISTRICTS.map((d) => (
                  <li key={d.id}>
                    {d.name}
                    {!d.verified && <span className="ml-1 text-xs">(unverified)</span>}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <h3 className="font-semibold text-foreground mb-2">Telangana ({TG_DISTRICTS.length})</h3>
              <ul className="text-sm text-muted-foreground grid grid-cols-2 gap-x-3 gap-y-1">
                {TG_DISTRICTS.map((d) => (
                  <li key={d.id}>
                    {d.name}
                    {!d.verified && <span className="ml-1 text-xs">(unverified)</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-3 rounded-xl border bg-secondary/40 p-5">
          <h2 className="text-xl font-semibold text-foreground">Straight numbers, with the limits stated</h2>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
            <li>Prices come from mandi and Agmarknet listings where available; otherwise they are labeled as reference figures.</li>
            <li>Distances are estimates, not turn-by-turn routes.</li>
            <li>Grading, moisture, and mandi commission are not included in the net-profit figure.</li>
            <li>This is a decision aid, not financial advice. Always confirm the mandi price before you ship.</li>
          </ul>
        </section>

        <p className="text-xs text-muted-foreground">
          Built on the myAI6 template. Read the <Link href="/terms" className="underline">terms of use</Link>.
        </p>
      </div>
    </div>
  );
}
