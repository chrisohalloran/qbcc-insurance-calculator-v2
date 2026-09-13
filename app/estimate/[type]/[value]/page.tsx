import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QuoteTemplate } from "@/components/quote-template";
import { EstimateLeadCapture } from "@/components/estimate-lead-capture";
import {
  calculateQuote,
  quotePath,
  SITE_URL,
  currency,
  WorkType,
} from "@/lib/quote";
type Props = {
  params: Promise<{ type: string; value: string }>;
  searchParams: Promise<{ units?: string; qleave?: string }>;
};
async function resolve({ params, searchParams }: Props) {
  const { type, value } = await params;
  const query = await searchParams;
  if (
    typeof value !== "string" ||
    (query.units !== undefined && typeof query.units !== "string") ||
    (query.qleave !== undefined && typeof query.qleave !== "string")
  )
    notFound();
  if (
    !/^\d+(\.\d{1,2})?$/.test(value) ||
    (query.units && !/^\d+$/.test(query.units)) ||
    (query.qleave && !/^\d+(\.\d{1,2})?$/.test(query.qleave))
  )
    notFound();
  try {
    return calculateQuote({
      workType: type as WorkType,
      insurableValue: Number(value),
      units: Number(query.units ?? 1),
      qleaveCostExGst:
        query.qleave === undefined ? undefined : Number(query.qleave),
    });
  } catch {
    notFound();
  }
}
export async function generateMetadata(props: Props): Promise<Metadata> {
  const q = await resolve(props);
  const curated =
    q.units === 1 &&
    q.qleaveCostExGst === undefined &&
    (q.workType === "new-construction"
      ? [300000, 450000, 600000]
      : [50000, 150000, 250000]
    ).includes(q.insurableValue);
  return {
    title: `QBCC estimate: ${currency(q.insurableValue)} ${q.workType === "renovation" ? "renovation" : "new construction"}`,
    description: `QBCC ${currency(q.premium)} and QLeave ${currency(q.qleave)}. See the calculation assumptions and edit this estimate.`,
    alternates: { canonical: SITE_URL + quotePath(q) },
    robots: { index: curated, follow: true },
  };
}
export default async function EstimatePage(props: Props) {
  const q = await resolve(props);
  return (
    <main className="min-h-screen bg-zinc-50 py-6">
      <QuoteTemplate
        workType={q.workType}
        insurableValue={q.insurableValue.toLocaleString("en-AU")}
        units={q.units}
        premium={q.premium}
        qleave={q.qleave}
        qleaveBasis={q.qleaveBasis}
      />
      <div className="mx-auto flex max-w-lg flex-wrap justify-center gap-5 px-5 print:hidden">
        <Link className="min-h-11 underline" href={quotePath(q, true)}>
          Edit this estimate
        </Link>
        <Link className="min-h-11 underline" href="/">
          Start a new estimate
        </Link>
      </div>
      <EstimateLeadCapture quoteData={q} />
    </main>
  );
}
