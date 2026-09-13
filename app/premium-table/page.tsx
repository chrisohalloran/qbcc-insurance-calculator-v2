import type { Metadata } from "next";
import Link from "next/link";
import { ContentLayout } from "@/components/content-layout";
import {
  calculateQuote,
  currency,
  quotePath,
  QBCC_SOURCE,
  QLEAVE_SOURCE,
} from "@/lib/quote";
const defaultMetadata: Metadata = {
  title: "QBCC insurance premium tables and examples | 2026",
  description:
    "Compare new-home and renovation premium estimates, understand GST and QLeave, and open an editable calculation. Official QBCC source links included.",
  alternates: {
    canonical: "https://www.qbccinsurancecalculator.com.au/premium-table",
  },
};
import ManagedPage, {
  generateMetadata as managedMetadata,
} from "../[slug]/page";
import { getTendrankPost } from "@/lib/tendrank-content";
import { publishedDraftAsPost } from "@/lib/tendrank-receiver";
export const revalidate = 5;
const managed = async () =>
  publishedDraftAsPost("premium-table") ??
  (await getTendrankPost("premium-table"));
export async function generateMetadata(): Promise<Metadata> {
  return (await managed())
    ? managedMetadata({ params: Promise.resolve({ slug: "premium-table" }) })
    : defaultMetadata;
}
const values = [50000, 150000, 165000, 300000, 450000, 600000];
export default async function PremiumTablePage() {
  if (await managed())
    return <ManagedPage params={Promise.resolve({ slug: "premium-table" })} />;
  return (
    <ContentLayout
      currentPath="/premium-table"
      title="QBCC insurance premium tables"
      intro="Compare estimates for one dwelling, then adjust the project details in the calculator."
    >
      <p>
        Published by Leva Solutions. Examples reviewed 13 September 2026. The
        calculator uses the QBCC tables effective 1 July 2020; verify the
        applicable table and final premium with QBCC before payment.
      </p>
      <p>
        <a href={QBCC_SOURCE}>Official QBCC premium tables</a> ·{" "}
        <a href={QLEAVE_SOURCE}>Official QLeave levy calculator</a>
      </p>
      <h2>New home and renovation examples</h2>
      <p>
        Project values include GST. QLeave assumes the same cost of work with
        GST removed. These examples assume one eligible dwelling.
      </p>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Value incl. GST</th>
              <th>New home premium</th>
              <th>Renovation premium</th>
              <th>QLeave</th>
            </tr>
          </thead>
          <tbody>
            {values.map((value) => {
              const q = calculateQuote({
                workType: "new-construction",
                insurableValue: value,
                units: 1,
              });
              const r = calculateQuote({ ...q, workType: "renovation" });
              return (
                <tr key={value}>
                  <th>{currency(value)}</th>
                  <td>
                    <Link href={quotePath(q, true)}>{currency(q.premium)}</Link>
                  </td>
                  <td>
                    <Link href={quotePath(r, true)}>{currency(r.premium)}</Link>
                  </td>
                  <td>{currency(q.qleave)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <h2>A $450,000 new home</h2>
      <p>
        The estimated QBCC premium is{" "}
        {currency(
          calculateQuote({
            workType: "new-construction",
            insurableValue: 450000,
            units: 1,
          }).premium,
        )}
        . Assuming the QLeave cost matches the contract value excluding GST, the
        levy is{" "}
        {currency(
          calculateQuote({
            workType: "new-construction",
            insurableValue: 450000,
            units: 1,
          }).qleave,
        )}
        .{" "}
        <Link href="/?type=new-construction&value=450000">
          Edit this example
        </Link>
        .
      </p>
      <h2>When does QLeave apply?</h2>
      <p>
        The levy is 0.575% when the cost of work reaches $150,000 excluding GST.
        With 10% GST throughout, this corresponds to $165,000 including GST. Use
        the separate QLeave cost input if its basis differs from the QBCC
        insurable value.
      </p>
      <h2>Multiple dwellings and eligibility</h2>
      <p>
        Dividing total value equally between dwellings is an estimating
        assumption. Confirm whether notional pricing applies to your work with
        QBCC. The calculator does not determine whether a building or contract
        is eligible for cover.
      </p>
      <p>
        <Link href="/who-needs-it">Who needs home warranty cover?</Link> ·{" "}
        <Link href="/guides/new-construction-vs-renovation">
          New construction or renovation?
        </Link>
      </p>
    </ContentLayout>
  );
}
