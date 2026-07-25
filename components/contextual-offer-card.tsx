"use client"

import { ArrowTopRightOnSquareIcon, EnvelopeIcon, LightBulbIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { Card, CardContent } from "@/components/catalyst/card"
import { Button } from "@/components/catalyst/button"
import { Text } from "@/components/catalyst/text"
import { Subheading } from "@/components/catalyst/heading"
import { RecommendedOffer, QuoteAnalyticsProperties, buildAttributedOfferHref } from "@/lib/lead-segmentation"

interface ContextualOfferCardProps {
  offer: RecommendedOffer
  analytics: QuoteAnalyticsProperties
  onDismiss: () => void
  onClick: (offer: RecommendedOffer) => void
}

export function ContextualOfferCard({ offer, analytics, onDismiss, onClick }: ContextualOfferCardProps) {
  const isExternal = offer.action === "external_link" && offer.href
  const attributedHref = isExternal ? buildAttributedOfferHref(offer, analytics) : undefined
  const Icon = isExternal ? ArrowTopRightOnSquareIcon : EnvelopeIcon

  return (
    <Card className="border-leva-orange/20 bg-gradient-to-br from-white to-orange-50/60 dark:border-leva-orange/30 dark:from-zinc-950 dark:to-zinc-900">
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-leva-orange/20 bg-white px-2.5 py-1 text-xs font-semibold text-leva-navy shadow-sm dark:border-white/10 dark:bg-zinc-900 dark:text-white">
              <LightBulbIcon className="size-3.5 text-leva-orange" />
              Recommended next step
            </div>
            <Subheading level={3} className="text-leva-navy dark:text-white">
              {offer.title}
            </Subheading>
            <Text className="mt-2 text-sm leading-6 text-gray-700 dark:text-zinc-300">
              {offer.body}
            </Text>
            <Text className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Based on this estimate: {offer.reason}
            </Text>

            {isExternal ? (
              <a
                href={attributedHref}
                target="_blank"
                rel="noreferrer"
                onClick={() => onClick(offer)}
                data-track-event="contextual-offer-click"
                data-track-offer={offer.id}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-leva-navy px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-leva-navy-light sm:w-auto dark:bg-leva-orange dark:hover:bg-leva-orange-light"
              >
                {offer.ctaLabel}
                <Icon className="size-4" />
              </a>
            ) : (
              <Button
                color="orange"
                type="button"
                onClick={() => onClick(offer)}
                className="mt-4 w-full justify-center sm:w-auto"
              >
                <Icon className="size-4 mr-2" />
                {offer.ctaLabel}
              </Button>
            )}
          </div>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss recommendation"
            className="shrink-0 rounded-md p-1 text-gray-500 hover:bg-black/5 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-zinc-200"
          >
            <XMarkIcon className="size-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
