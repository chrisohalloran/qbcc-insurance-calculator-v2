"use client";

import { captureEvent } from "@/lib/analytics";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePostHog } from "posthog-js/react";
import { Field, Label, Description } from "./catalyst/fieldset";
import { Input } from "./catalyst/input";
import { Select } from "./catalyst/select";
import { Button } from "./catalyst/button";
import { PremiumBreakdown } from "./premium-breakdown";
import { QuoteTemplate } from "./quote-template";
import { LeadCaptureModal } from "./lead-capture-modal";
import { LodgeWaitlistModal } from "./lodge-waitlist-modal";
import { ContextualOfferCard } from "./contextual-offer-card";
import { RateNotificationBanner } from "./rate-notification-banner";
import {
  buildQuoteAnalyticsProperties,
  getRecommendedOffer,
  RecommendedOffer,
} from "@/lib/lead-segmentation";
import {
  calculateQuote,
  Quote,
  WorkType,
  currency,
  quotePath,
  quoteSummary,
  RATE_REVIEWED,
  QBCC_SOURCE,
  QLEAVE_SOURCE,
} from "@/lib/quote";
import { registerCalculatorTools } from "@/lib/webmcp";
import { parseFormattedNumber, parsePositiveInteger } from "@/lib/validation";
import {
  ArrowPathIcon,
  CalculatorIcon,
  ClipboardIcon,
  ShareIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";

export function CalculatorForm() {
  const [workType, setWorkType] = useState<WorkType>("new-construction");
  const [value, setValue] = useState("");
  const [units, setUnits] = useState("1");
  const [customBasis, setCustomBasis] = useState(false);
  const [basis, setBasis] = useState("");
  const [result, setResult] = useState<Quote | null>(null);
  const [comparison, setComparison] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [emailOpen, setEmailOpen] = useState(false);
  const [pilotOpen, setPilotOpen] = useState(false);
  const [role, setRole] = useState("");
  const [offerDismissed, setOfferDismissed] = useState(false);
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);
  const lastQuote = useRef<Quote | null>(null);
  const interaction = useRef(false);
  const firstResult = useRef(false);
  const [visibleActor, setVisibleActor] = useState<"human" | "agent">("human");
  const actor = useRef<"human" | "agent">("human");
  const posthog = usePostHog();
  const capture = useCallback(
    (name: string, quote?: Quote) => {
      captureEvent(
        posthog,
        name,
        quote
          ? {
              ...buildQuoteAnalyticsProperties(quote),
              quote_revision: quote.revision,
              rate_version: quote.rateVersion,
              actor: actor.current,
            }
          : { actor: actor.current },
      );
    },
    [posthog],
  );
  const acceptQuote = useCallback(
    (quote: Quote) => {
      setResult(quote);
      setError("");
      setPending(false);
      if (quote.revision === lastQuote.current?.revision) return;
      lastQuote.current = quote;
      capture("estimate_updated", quote);
      if (!firstResult.current) {
        capture("calculation_completed", quote);
        firstResult.current = true;
      }
    },
    [capture],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("type") === "renovation") setWorkType("renovation");
    if (params.has("value")) setValue(params.get("value")!);
    if (params.has("units")) setUnits(params.get("units")!);
    if (params.has("qleave")) {
      setCustomBasis(true);
      setBasis(params.get("qleave")!);
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      if (!value.trim()) {
        setResult(null);
        setError("");
        setPending(false);
        return;
      }
      try {
        const parsedValue = parseFormattedNumber(value);
        const parsedUnits = parsePositiveInteger(units);
        const parsedBasis = customBasis
          ? parseFormattedNumber(basis)
          : undefined;
        if (parsedValue === null)
          throw new Error("Enter a valid insurable value, for example 450000.");
        if (parsedUnits === null)
          throw new Error("Units must be a whole number of 1 or more.");
        if (parsedBasis === null)
          throw new Error("Enter the QLeave cost of work excluding GST.");
        acceptQuote(
          calculateQuote({
            workType,
            insurableValue: parsedValue,
            units: parsedUnits,
            qleaveCostExGst: parsedBasis,
          }),
        );
      } catch (e) {
        setPending(false);
        setResult(null);
        setError(
          e instanceof Error ? e.message : "Check your project details.",
        );
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [value, units, workType, basis, customBasis, ready, acceptQuote]);
  useEffect(
    () =>
      registerCalculatorTools(
        (quote) => {
          actor.current = "agent";
          setVisibleActor("agent");
          setWorkType(quote.workType);
          setValue(String(quote.insurableValue));
          setUnits(String(quote.units));
          setCustomBasis(quote.qleaveCostExGst !== undefined);
          setBasis(String(quote.qleaveCostExGst ?? ""));
          acceptQuote(quote);
          capture("agent_calculation_completed", quote);
        },
        () => capture("agent_tool_registration_failed"),
      ),
    [acceptQuote, capture],
  );

  const started = () => {
    actor.current = "human";
    setVisibleActor("human");
    setNotice("");
    setError("");
    setPending(true);
    if (!interaction.current) {
      capture("calculator_interaction_started");
      interaction.current = true;
    }
  };
  const reset = () => {
    setPending(false);
    setValue("");
    setUnits("1");
    setBasis("");
    setCustomBasis(false);
    setResult(null);
    setComparison(null);
    setError("");
    setNotice("");
    lastQuote.current = null;
  };
  const offer = result ? getRecommendedOffer(result) : null;
  const showOffer =
    offer &&
    !offerDismissed &&
    (offer.partner !== "Leva Relay" || role === "builder");
  const quoteAnalytics = result
    ? {
        ...buildQuoteAnalyticsProperties(result),
        quote_revision: result.revision,
        actor: visibleActor,
      }
    : null;
  const clickOffer = (offer: RecommendedOffer) => {
    if (!result) return;
    capture("contextual_offer_clicked", result);
    if (offer.action === "email_quote") setEmailOpen(true);
  };
  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(quoteSummary(result));
      setNotice("Estimate copied.");
      capture("copy_quote", result);
    } catch {
      setNotice(
        "Copy is unavailable. Open the shareable estimate to copy or print it.",
      );
    }
  };
  const delta = result && comparison ? result.total - comparison.total : null;

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start print:hidden">
        <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
          <header className="flex items-center gap-3 border-b border-zinc-200 p-6 dark:border-zinc-800">
            <CalculatorIcon className="size-7 text-leva-navy dark:text-orange-300" />
            <div>
              <h1 className="text-xl font-bold">QBCC premium calculator</h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                Your estimate updates as you type.
              </p>
            </div>
          </header>
          <div className="grid gap-5 p-6 sm:grid-cols-2">
            <Field className="sm:col-span-2">
              <Label>Work type</Label>
              <Select
                name="work_type"
                value={workType}
                onChange={(e) => {
                  started();
                  setWorkType(e.target.value as WorkType);
                }}
              >
                <option value="new-construction">New construction</option>
                <option value="renovation">Renovation / addition</option>
              </Select>
            </Field>
            <Field>
              <Label>Insurable value ($)</Label>
              <Description>Including GST, labour and materials.</Description>
              <Input
                inputMode="decimal"
                name="insurable_value"
                placeholder="e.g. 450,000"
                value={value}
                onChange={(e) => {
                  started();
                  setValue(e.target.value);
                }}
                aria-describedby={error ? "calculation-error" : undefined}
              />
            </Field>
            <Field>
              <Label>Number of dwellings</Label>
              <Description>Total value is split equally.</Description>
              <Input
                inputMode="numeric"
                name="units"
                value={units}
                onChange={(e) => {
                  started();
                  setUnits(e.target.value);
                }}
              />
            </Field>
            {Number(units) > 1 && (
              <p className="text-sm text-zinc-600 dark:text-zinc-300 sm:col-span-2">
                This estimate assumes equal values and eligibility for notional
                pricing.{" "}
                <a
                  className="underline"
                  href="https://www.qbcc.qld.gov.au/running-your-business/home-warranty-insurance-obligations/calculating-premium"
                  target="_blank"
                  rel="noreferrer"
                >
                  Check QBCC eligibility
                </a>
                .
              </p>
            )}
            <div className="sm:col-span-2">
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={customBasis}
                  onChange={(e) => {
                    started();
                    setCustomBasis(e.target.checked);
                  }}
                  className="rounded"
                />
                Use a different cost of work for QLeave
              </label>
              {customBasis && (
                <Field className="mt-3">
                  <Label>QLeave cost of work ($ excluding GST)</Label>
                  <Input
                    inputMode="decimal"
                    value={basis}
                    onChange={(e) => {
                      started();
                      setBasis(e.target.value);
                    }}
                  />
                </Field>
              )}
            </div>
            {error && (
              <p
                id="calculation-error"
                role="alert"
                className="text-sm text-red-700 dark:text-red-300 sm:col-span-2"
              >
                {error}
              </p>
            )}
          </div>
          <div className="flex justify-end border-t border-zinc-200 p-3 dark:border-zinc-800">
            <Button plain onClick={reset}>
              <ArrowPathIcon className="size-4" />
              Reset
            </Button>
          </div>
        </section>
        <section
          aria-label="Estimate result"
          aria-busy={pending}
          inert={pending}
          className="rounded-xl bg-leva-navy p-6 text-white lg:col-start-3 lg:row-span-2"
        >
          <h2 className="text-lg font-semibold text-white">
            Estimated QBCC + QLeave
          </h2>
          {pending && (
            <p className="mt-2 text-sm text-blue-100">Updating estimate…</p>
          )}
          <div aria-live="polite" aria-atomic="true">
            <p className="my-5 text-4xl font-bold tabular-nums">
              {result ? currency(result.total) : "—"}
            </p>
            {!result && (
              <p className="text-sm text-blue-100">
                {error
                  ? "Check your project details."
                  : "Enter your project value to see an estimate."}
              </p>
            )}
          </div>
          {result && (
            <>
              <dl className="space-y-3 border-y border-white/20 py-4 text-sm">
                <div className="flex justify-between gap-2">
                  <dt>QBCC insurance</dt>
                  <dd className="font-semibold">{currency(result.premium)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>QLeave levy</dt>
                  <dd className="font-semibold">{currency(result.qleave)}</dd>
                </div>
              </dl>
              <p className="mt-4 text-sm leading-6 text-blue-100">
                {result.qleave
                  ? `QLeave: 0.575% of ${currency(result.qleaveBasis)} excluding GST.`
                  : `QLeave cost: ${currency(result.qleaveBasis)} excluding GST. The levy starts at $150,000.`}
              </p>
              {result.premium === 0 && (
                <p className="mt-3 text-sm text-blue-100">
                  Below the calculator&apos;s $3,300 premium threshold. Confirm
                  whether your work needs cover.
                </p>
              )}
              <div className="mt-5 grid gap-2">
                <Button
                  color="white"
                  onClick={() => {
                    capture("email_quote_clicked", result);
                    setEmailOpen(true);
                  }}
                >
                  Email my quote
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button color="light" onClick={copy}>
                    <ClipboardIcon className="size-4" />
                    Copy
                  </Button>
                  <Button
                    color="light"
                    href={quotePath(result)}
                    onClick={() => capture("share_quote", result)}
                  >
                    <ShareIcon className="size-4" />
                    Share
                  </Button>
                </div>
                <Button
                  color="light"
                  onClick={() => {
                    capture("print_quote", result);
                    window.print();
                  }}
                >
                  <PrinterIcon className="size-4" />
                  Print estimate
                </Button>
              </div>
              <div className="mt-5 border-t border-white/20 pt-4">
                <button
                  className="min-h-11 text-sm font-semibold underline underline-offset-4"
                  onClick={() => {
                    setComparison(result);
                    capture("comparison_saved", result);
                  }}
                >
                  Compare with another value
                </button>
                {delta !== null && (
                  <p className="text-sm text-blue-100">
                    {delta === 0
                      ? "Change the project details to compare."
                      : `${currency(Math.abs(delta))} ${delta > 0 ? "more" : "less"} than your saved ${currency(comparison!.total)} estimate.`}
                  </p>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <a
                  className="inline-flex min-h-11 items-center underline"
                  href="https://my.qbcc.qld.gov.au"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => capture("open_qbcc_portal_clicked", result)}
                >
                  Open QBCC Portal
                </a>
                {result.qleave > 0 && (
                  <a
                    className="inline-flex min-h-11 items-center underline"
                    href={QLEAVE_SOURCE}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => capture("open_qleave_clicked", result)}
                  >
                    Open QLeave
                  </a>
                )}
              </div>
            </>
          )}
          <p className="mt-4 text-xs leading-5 text-blue-100">
            Estimate only.{" "}
            <a
              href={QBCC_SOURCE}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              QBCC tables
            </a>{" "}
            effective 1 July 2020.{" "}
            <a
              href={QLEAVE_SOURCE}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              QLeave rate
            </a>{" "}
            checked {RATE_REVIEWED}.
          </p>
        </section>
        {result && (
          <section inert={pending} className="space-y-5 lg:col-span-2">
            <PremiumBreakdown
              type={result.workType}
              originalValue={result.insurableValue}
              roundedValue={Math.ceil(result.insurableValue / 1000) * 1000}
              units={result.units}
              premium={result.premium}
            />
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <Field>
                <Label>I&apos;m estimating as (optional)</Label>
                <Select
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    setOfferDismissed(false);
                    captureEvent(posthog, "audience_selected", {
                      role: e.target.value,
                    });
                  }}
                >
                  <option value="">Select a role</option>
                  <option value="builder">Builder / trade business</option>
                  <option value="owner">Homeowner</option>
                  <option value="other">Other</option>
                </Select>
              </Field>
            </div>
            {showOffer && quoteAnalytics && (
              <ContextualOfferCard
                key={offer.id}
                offer={offer}
                analytics={quoteAnalytics}
                onClick={clickOffer}
                onDismiss={() => {
                  setOfferDismissed(true);
                  capture("contextual_offer_dismissed", result);
                }}
              />
            )}
            <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
              <h2 className="font-semibold">
                Project information prep — coming soon
              </h2>
              <p className="my-3 text-sm text-zinc-600 dark:text-zinc-300">
                We prepare your project information checklist and saved
                estimate.
              </p>
              <Button
                outline
                onClick={() => {
                  capture("draft_prep_help_clicked", result);
                  setPilotOpen(true);
                }}
              >
                Join $30 project-info prep pilot
              </Button>
            </div>
            <RateNotificationBanner />
          </section>
        )}
      </div>
      <p role="status" className="mt-3 text-sm print:hidden">
        {notice}
      </p>
      {result && (
        <>
          <div className="hidden print:block">
            <QuoteTemplate
              workType={result.workType}
              insurableValue={result.insurableValue.toLocaleString("en-AU")}
              units={result.units}
              premium={result.premium}
              qleave={result.qleave}
              qleaveBasis={result.qleaveBasis}
            />
          </div>
          <LeadCaptureModal
            isOpen={emailOpen}
            onClose={() => setEmailOpen(false)}
            trigger="email_quote_button"
            quoteData={result}
          />
          <LodgeWaitlistModal
            isOpen={pilotOpen}
            onClose={() => setPilotOpen(false)}
            quoteData={result}
          />
        </>
      )}
    </>
  );
}
