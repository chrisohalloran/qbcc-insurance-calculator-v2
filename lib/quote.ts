import {
  calculateQLDHomeWarrantyPremium,
  calculateMultipleDwellingsPremium,
  calculateQLDRenovationPremium,
  calculateMultipleUnitsPremium,
} from "./premium-calculator";
import { MAX_UNITS } from "./validation";

export const SITE_URL = "https://www.qbccinsurancecalculator.com.au";
export const RATE_VERSION = "qbcc-2020-07-01-qleave-2026-09-13";
export const RATE_REVIEWED = "13 September 2026";
export const QBCC_SOURCE =
  "https://www.qbcc.qld.gov.au/running-your-business/home-warranty-insurance-obligations/take-out-home-warranty-cover";
export const QLEAVE_SOURCE =
  "https://www.qleave.qld.gov.au/building-and-construction/levy-payers/paying-the-levy/levy-calculator";
export const MAX_VALUE = 1_000_000_000;
export type WorkType = "new-construction" | "renovation";
export interface QuoteInput {
  workType: WorkType;
  insurableValue: number;
  units: number;
  qleaveCostExGst?: number;
}
export interface Quote extends QuoteInput {
  premium: number;
  qleave: number;
  total: number;
  qleaveBasis: number;
  rateVersion: string;
  revision: string;
}
export const currency = (value: number) =>
  value.toLocaleString("en-AU", { style: "currency", currency: "AUD" });
export function calculateQuote(input: QuoteInput): Quote {
  if (!["new-construction", "renovation"].includes(input.workType))
    throw new Error("Select a valid work type.");
  if (
    !Number.isFinite(input.insurableValue) ||
    input.insurableValue < 0 ||
    input.insurableValue > MAX_VALUE
  )
    throw new Error("Enter a value between $0 and $1 billion.");
  if (
    !Number.isInteger(input.units) ||
    input.units < 1 ||
    input.units > MAX_UNITS
  )
    throw new Error(`Units must be a whole number from 1 to ${MAX_UNITS}.`);
  if (
    input.qleaveCostExGst !== undefined &&
    (!Number.isFinite(input.qleaveCostExGst) ||
      input.qleaveCostExGst < 0 ||
      input.qleaveCostExGst > MAX_VALUE)
  )
    throw new Error("Enter a valid QLeave cost excluding GST.");
  const value = Math.round(input.insurableValue * 100) / 100;
  const qleaveBasis =
    Math.round((input.qleaveCostExGst ?? value / 1.1) * 100) / 100;
  const premium =
    Math.round(
      (input.workType === "new-construction"
        ? input.units === 1
          ? calculateQLDHomeWarrantyPremium(value)
          : calculateMultipleDwellingsPremium(value, input.units)
        : input.units === 1
          ? calculateQLDRenovationPremium(value)
          : calculateMultipleUnitsPremium(value, input.units)) * 100,
    ) / 100;
  const qleave =
    qleaveBasis >= 150000 ? Math.round(qleaveBasis * 0.00575 * 100) / 100 : 0;
  return {
    ...input,
    insurableValue: value,
    qleaveCostExGst: input.qleaveCostExGst === undefined ? undefined : qleaveBasis,
    premium,
    qleave,
    total: Math.round((premium + qleave) * 100) / 100,
    qleaveBasis,
    rateVersion: RATE_VERSION,
    revision: `${input.workType}:${value}:${input.units}:${input.qleaveCostExGst === undefined ? "auto" : qleaveBasis}:${RATE_VERSION}`,
  };
}
export function quotePath(quote: QuoteInput, edit = false) {
  const search = new URLSearchParams();
  if (edit) {
    search.set("type", quote.workType);
    search.set("value", String(quote.insurableValue));
  }
  if (quote.units > 1) search.set("units", String(quote.units));
  if (quote.qleaveCostExGst !== undefined)
    search.set("qleave", String(quote.qleaveCostExGst));
  return `${edit ? "/" : `/estimate/${quote.workType}/${quote.insurableValue}`}${search.size ? `?${search}` : ""}`;
}
export function quoteSummary(quote: Quote) {
  return [
    `QBCC + QLeave estimate`,
    `${quote.workType === "new-construction" ? "New construction" : "Renovation"} · ${quote.units} dwelling${quote.units === 1 ? "" : "s"}`,
    `Insurable value (incl. GST): ${currency(quote.insurableValue)}`,
    `QBCC: ${currency(quote.premium)}`,
    `QLeave: ${currency(quote.qleave)} (cost excl. GST: ${currency(quote.qleaveBasis)})`,
    `Estimated total: ${currency(quote.total)}`,
    `Rates reviewed ${RATE_REVIEWED}. Confirm eligibility and final amounts with QBCC and QLeave.`,
    SITE_URL + quotePath(quote),
  ].join("\n");
}
