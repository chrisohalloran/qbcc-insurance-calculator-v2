import type React from "react"
import type { Metadata, Viewport } from "next"
import { DM_Sans } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import GoogleAnalytics from "@/components/google-analytics"
import { Analytics } from "@vercel/analytics/react"
import { PostHogProvider } from "@/components/PostHogProvider"
// import { GTM_ID } from "@/lib/gtm"

const dmSans = DM_Sans({ subsets: ["latin"] })

// Your Google Analytics Measurement ID
const GA_MEASUREMENT_ID = "G-HFTV8CW3HR"
const GTM_ID = "GTM-MBLZJ6T2"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1e1e2e" },
  ],
}

export const metadata: Metadata = {
  title: "QBCC Home Warranty Insurance Calculator | Premium Estimator",
  description:
    "Calculate QBCC home warranty insurance premiums for new construction and renovations based on the July 2020 premium table. Free online calculator for Queensland builders and homeowners.",
  keywords: [
    "QBCC Home Warranty Insurance Calculator",
    "Queensland Building and Construction Commission",
    "QBCC premium calculator",
    "home warranty insurance fees",
    "QBCC insurance premium rates",
    "calculate QBCC insurance",
    "Queensland home warranty scheme",
    "QBCC insurance estimator",
    "building insurance calculator Queensland",
  ],
  authors: [{ name: "QBCC Calculator" }],
  creator: "QBCC Calculator",
  publisher: "QBCC Calculator",
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: "https://www.qbccinsurancecalculator.com.au/",
    title: "QBCC Home Warranty Insurance Calculator | Premium Estimator",
    description:
      "Calculate QBCC home warranty insurance premiums for new construction and renovations based on the July 2020 premium table.",
    siteName: "QBCC Home Warranty Insurance Calculator",
  },
  twitter: {
    card: "summary_large_image",
    title: "QBCC Home Warranty Insurance Calculator | Premium Estimator",
    description:
      "Calculate QBCC home warranty insurance premiums for new construction and renovations based on the July 2020 premium table.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://www.qbccinsurancecalculator.com.au/",
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en-AU" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');
    `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "QBCC Home Warranty Insurance Calculator",
              "url": "https://www.qbccinsurancecalculator.com.au/",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://www.qbccinsurancecalculator.com.au/?value={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "description": "Free calculator for Queensland Building and Construction Commission (QBCC) insurance premiums and QLeave levies.",
              "publisher": {
                "@type": "Organization",
                "name": "Leva Solutions",
                "url": "https://levasolutions.com.au"
              }
            })
          }}
        />
          <meta name="google-site-verification" content="fQIteIi5biuA9VgwHV27KkUghf_rHmivHf_6o-tm7DI" />
</head>
      <body className={dmSans.className}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <PostHogProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </PostHogProvider>
        <GoogleAnalytics GA_MEASUREMENT_ID={GA_MEASUREMENT_ID} />
        <Analytics />
      </body>
    </html>
  )
}