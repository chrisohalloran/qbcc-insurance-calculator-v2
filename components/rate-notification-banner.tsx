"use client"

import { useState } from "react"
import { Field, Label } from "@/components/catalyst/fieldset"
import { Input } from "@/components/catalyst/input"
import { Button } from "@/components/catalyst/button"
import { Text } from "@/components/catalyst/text"
import { BellIcon, XMarkIcon, CheckCircleIcon } from "@heroicons/react/24/outline"
import { LeadCaptureRequest, ApiResponse } from "@/lib/types"
import { isValidEmail, normalizeEmail } from "@/lib/validation"

export function RateNotificationBanner() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [error, setError] = useState("")
  const [emailError, setEmailError] = useState("")

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
      const requestData: LeadCaptureRequest = {
        email: cleanEmail,
        source: "rate-notification"
      }

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      let data: ApiResponse | null = null
      try {
        data = (await response.json()) as ApiResponse
      } catch {
        data = null
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Unable to submit right now. Please try again.")
      }

      setIsSuccess(true)
      
      // Hide banner after delay
      setTimeout(() => {
        setIsVisible(false)
      }, 3000)

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="sticky top-16 z-40 bg-gradient-to-r from-leva-navy to-leva-navy-light text-white border-b border-leva-navy-light/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          
          {/* Icon and Message */}
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white/10 rounded-lg">
              <BellIcon className="size-4" />
            </div>
            <div className="flex-1">
              {isSuccess ? (
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="size-4 text-green-400" />
                  <Text className="text-sm font-medium text-white">
                    Great! We'll notify you when QBCC rates change.
                  </Text>
                </div>
              ) : (
                <Text className="text-sm font-medium text-white">
                  Get notified when QBCC insurance rates change
                </Text>
              )}
            </div>
          </div>

          {/* Form or Success State */}
          {!isSuccess ? (
            <div className="flex items-center gap-2">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
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
                  className="w-48 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40"
                  required
                />
                <Button
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  className="bg-leva-orange hover:bg-leva-orange-light text-white border-0 text-sm px-3 py-1.5"
                >
                  {isSubmitting ? "..." : "Notify Me"}
                </Button>
              </form>
              
              <button
                onClick={handleDismiss}
                className="text-white/60 hover:text-white ml-2"
                title="Dismiss"
              >
                <XMarkIcon className="size-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleDismiss}
              className="text-white/60 hover:text-white"
              title="Close"
            >
              <XMarkIcon className="size-4" />
            </button>
          )}
        </div>
        
        {error && (
          <div className="mt-2">
            <Text className="text-xs text-red-300">
              {error}
            </Text>
          </div>
        )}
        {emailError && (
          <div className="mt-2">
            <Text className="text-xs text-red-300">
              {emailError}
            </Text>
          </div>
        )}
      </div>
    </div>
  )
}
