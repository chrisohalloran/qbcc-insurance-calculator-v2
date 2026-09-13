"use client"

import { usePathname, useSearchParams } from "next/navigation"
import Script from "next/script"
import { useEffect, useState, useRef, Suspense } from "react"

// Client component that uses searchParams
function GoogleAnalyticsInner({ GA_MEASUREMENT_ID, ready }: { GA_MEASUREMENT_ID: string; ready: boolean }) {
  const lastPage = useRef('')
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const page = pathname + (searchParams?.toString() ? `?${searchParams}` : '')
    if (ready && pathname && window.gtag && lastPage.current !== page) {
      lastPage.current = page
      // Send pageview with updated path
      window.gtag("event", "page_view", {
        send_to: GA_MEASUREMENT_ID,
        page_path: pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : ""),
      })
    }
  }, [pathname, searchParams, GA_MEASUREMENT_ID, ready])

  return null
}

// Wrapper component that provides Suspense boundary
export default function GoogleAnalytics({ GA_MEASUREMENT_ID }: { GA_MEASUREMENT_ID: string }) {
  const [ready, setReady] = useState(false)
  return (
    <>
      <Script strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
      <Script
        onReady={() => setReady(true)}
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              send_page_view: false,
            });
          `,
        }}
      />
      <Suspense fallback={null}>
        <GoogleAnalyticsInner GA_MEASUREMENT_ID={GA_MEASUREMENT_ID} ready={ready} />
      </Suspense>
    </>
  )
}

// Add this to make TypeScript recognize gtag
declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: Record<string, any> | undefined) => void
  }
}
