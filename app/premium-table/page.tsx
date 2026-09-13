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
  title: "QBCC Home Warranty Insurance Table 2026 | Premium Examples",
  description:
    "Compare new-home and renovation premium estimates, understand GST and QLeave, and open an editable calculation. Official QBCC source links included.",
  alternates: {
    canonical: "https://www.qbccinsurancecalculator.com.au/premium-table",
  },
};
export const metadata = defaultMetadata;
const values = [5000, 10000, 20000, 30000, 50000, 75000, 100000, 125000, 150000, 165000, 175000, 200000, 250000, 300000, 350000, 400000, 450000, 500000, 600000, 700000, 800000, 900000, 1000000, 1200000];
export default function PremiumTablePage() {
  return (
    <ContentLayout
      currentPath="/premium-table"
      title="QBCC home warranty insurance table 2026"
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
      <h2>Which premium table should I use?</h2>
      <p>
        QBCC publishes separate tables for new home construction and for
        renovations, alterations, additions and repairs. Choose the table that
        matches the work, then find the band for its insurable value including GST.
        The examples below are estimates, not a replacement for the full official tables.
      </p>
      <p>
        <a href={QBCC_SOURCE}>Download the official QBCC premium tables</a> or{" "}
        <Link href="/guides/new-construction-vs-renovation">compare work types</Link>.
      </p>
      <h2>New home and renovation examples</h2>
      <p>
        Project values include GST. QLeave assumes the same cost of work with
        GST removed. These examples assume one eligible dwelling.
      </p>
      <div className="overflow-x-auto">
        <table>
          <caption className="mb-3 text-left text-sm">Estimated premiums for one dwelling (AUD). Select a premium to edit the calculation.</caption>
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
      <h2>Is this a new set of 2026 rates?</h2>
      <p>
        The year identifies this guide, not a new rate commencement date. These
        estimates use the tables effective 1 July 2020. Check QBCC’s official
        download page for the table applicable when you take out cover.
      </p>
      <h2>What is included in the insurable value?</h2>
      <p>
        The insurable value is not always the contract price. Owner-supplied
        materials and the QLeave levy can affect the amount used by QBCC.
        Confirm that basis before entering a value; the examples do not adjust
        it automatically for those items.
      </p>
      <p><a href="https://www.qbcc.qld.gov.au/running-your-business/home-warranty-insurance-obligations/calculating-premium">QBCC’s insurable-value guidance</a></p>
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
