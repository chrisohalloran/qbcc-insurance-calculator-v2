"use client"

import { captureEvent } from "@/lib/analytics"
import { usePostHog } from "posthog-js/react"

export function RelayCta({ source }: { source: string }) {
  const posthog = usePostHog()
  const handleClick = () => {
    captureEvent(posthog, "relay_cta_click", { source, placement: "content_page", actor: "human" })
    window.dispatchEvent(
      new CustomEvent("leva-relay-cta-click", {
        detail: {
          source,
          placement: "content-page",
        },
      }),
    )
  }

  return (
    <aside className="rounded-xl border border-leva-navy/20 bg-leva-navy/[0.03] p-5">
      <h2 className="text-lg font-semibold text-leva-navy">Never miss inbound jobs</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-700">
        If you are a Queensland builder, your phone still rings while you are on site. Leva Relay is an AI
        receptionist that answers calls, books jobs, and sends quotes.
      </p>
      <a
        href="https://levasolutions.com.au/relay"
        target="_blank"
        rel="noreferrer"
        onClick={handleClick}
        data-track-event="leva-relay-cta-click"
        data-track-source={source}
        className="mt-4 inline-flex text-sm font-semibold text-leva-navy hover:text-leva-navy-light"
      >
        Try Relay free →
      </a>
    </aside>
  )
}
