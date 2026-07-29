import { Metadata } from "next";

export const metadata: Metadata = {
  title: "QBCC Home Warranty Insurance Calculator | Free Premium Estimate",
  description: "Calculate accurate QBCC Home Warranty Insurance premiums and QLeave levies for Queensland construction projects. Updated 2024 rates for new homes and renovations.",
  openGraph: {
    title: "QBCC Insurance Calculator",
    description: "Instant estimate for QBCC Home Warranty Insurance and QLeave Levy.",
    url: "https://www.qbccinsurancecalculator.com.au",
    siteName: "QBCC Calculator by Leva",
    locale: "en_AU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "QBCC Calculator",
    description: "Calculate your QBCC insurance premium in seconds.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};
