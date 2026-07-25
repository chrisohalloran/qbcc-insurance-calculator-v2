"use client"

import { useEffect, useState } from "react"
import { Field, Label } from "@/components/catalyst/fieldset"
import { Input } from "@/components/catalyst/input"
import { Button } from "@/components/catalyst/button"
import { Text } from "@/components/catalyst/text"
import { Card, CardContent } from "@/components/catalyst/card"
import { EnvelopeIcon, CheckCircleIcon } from "@heroicons/react/24/outline"
import { LeadCaptureRequest, ApiResponse, LeadReviewStatus } from "@/lib/types"
import { isValidEmail, normalizeEmail } from "@/lib/validation"
import { buildQuoteAnalyticsProperties } from "@/lib/lead-segmentation"
import { usePostHog } from "posthog-js/react"

interface EstimateLeadCaptureProps {
  quoteData: {
    workType: string
    insurableValue: number
    units: number
    premium: number
    qleave: number
  }
}

export function EstimateLeadCapture({ quoteData }: EstimateLeadCaptureProps) {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [emailError, setEmailError] = useState("")
  const posthog = usePostHog()

  useEffect(() => {
    const analyticsProperties = buildQuoteAnalyticsProperties(quoteData)
    posthog?.capture("lead_capture_viewed", {
      ...analyticsProperties,
      lead_capture_trigger: "estimate_page",
    })
  }, [
    posthog,
    quoteData.workType,
    quoteData.insurableValue,
    quoteData.units,
    quoteData.premium,
    quoteData.qleave,
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanEmail = normalizeEmail(email)
    if (!isValidEmail(cleanEmail)) {
      setEmailError("Enter a valid email address.")
      return
    }

    setIsSubmitting(true)
    setError("")
    setEmailError("")

    try {
      const analyticsProperties = buildQuoteAnalyticsProperties(quoteData)
      posthog?.capture("email_quote_clicked", {
        ...analyticsProperties,
        lead_capture_trigger: "estimate_page",
      })

      const requestData: LeadCaptureRequest = {
        email: cleanEmail,
        source: "post-calculation",
        workType: quoteData.workType,
        insurableValue: quoteData.insurableValue,
        units: quoteData.units,
        premium: quoteData.premium,
        qleave: quoteData.qleave,
        valueBand: analyticsProperties.value_band,
        projectSegment: analyticsProperties.project_segment,
        qleaveApplicable: analyticsProperties.qleave_applicable,
        recommendedOfferId: analyticsProperties.recommended_offer_id,
        recommendedOfferPartner: analyticsProperties.recommended_offer_partner,
        leadCaptureTrigger: "estimate_page",
      }

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      let data: ApiResponse<{
        message: string
        leadReference: string
        reviewStatus: LeadReviewStatus
      }> | null = null
      try {
        data = (await response.json()) as ApiResponse<{
          message: string
          leadReference: string
          reviewStatus: LeadReviewStatus
        }>
      } catch {
        data = null
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Unable to submit right now. Please try again.")
      }

      if (!data.data?.leadReference || data.data.reviewStatus !== "pending_review") {
        throw new Error("The quote was saved, but its receipt was incomplete. Please contact support before trying again.")
      }

      setIsSuccess(true)
      posthog?.capture("email_quote_submitted", {
        ...analyticsProperties,
        source: "post-calculation",
        lead_capture_trigger: "estimate_page",
        lead_reference: data.data.leadReference,
        lead_review_status: data.data.reviewStatus,
        has_name: false,
        has_phone: false,
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 2,
    })
  }

  return (
    <Card className="max-w-md mx-auto mt-8 print:hidden">
      <CardContent className="p-6">
        {isSuccess ? (
          <div className="text-center">
            <CheckCircleIcon className="size-8 text-green-500 mx-auto mb-3" />
            <Text className="font-semibold text-zinc-900 dark:text-white mb-2">
              Quote Saved!
            </Text>
            <Text className="text-sm text-zinc-600 dark:text-zinc-400">
              We've emailed your {formatCurrency(quoteData.premium + quoteData.qleave)} estimate to you.
            </Text>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-leva-orange/10 rounded-lg text-leva-orange">
                <EnvelopeIcon className="size-5" />
              </div>
              <div>
                <Text className="font-semibold text-zinc-900 dark:text-white">
                  Save This Estimate
                </Text>
                <Text className="text-sm text-zinc-600 dark:text-zinc-400">
                  Get your {formatCurrency(quoteData.premium + quoteData.qleave)} quote emailed to you
                </Text>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={email}
                  aria-invalid={Boolean(emailError)}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (emailError) {
                      setEmailError("")
                    }
                    if (error) {
                      setError("")
                    }
                  }}
                  placeholder="your.email@example.com"
                  required
                />
                {emailError && (
                  <Text className="mt-2 text-sm text-red-700 dark:text-red-400">
                    {emailError}
                  </Text>
                )}
              </Field>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <Text className="text-sm text-red-800 dark:text-red-400">
                    {error}
                  </Text>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="w-full bg-leva-orange hover:bg-leva-orange-light text-white border-0"
              >
                {isSubmitting ? "Sending..." : "Email Quote to Me"}
              </Button>

              <Text className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                We'll only email you this quote. No spam, ever.
              </Text>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  )
}
