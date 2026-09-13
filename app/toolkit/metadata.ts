import type { Metadata } from "next"

const title = "QBCC Insurance and QLeave Calculator | Builder Tools"
const description = "Estimate QBCC home warranty premiums and QLeave, compare project costs, and copy or print your quote. Free calculator and premium-table reference."
export const metadata: Metadata = {
  title,
  description,
  openGraph: { type: "website", title, description, url: "/toolkit" },
  twitter: { card: "summary_large_image", title, description },
  alternates: { canonical: "https://www.qbccinsurancecalculator.com.au/toolkit" },
}
