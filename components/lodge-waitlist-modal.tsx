"use client"

import { useRef, useState, useEffect } from "react"
import { Dialog, DialogPanel, DialogTitle, DialogBackdrop } from "@headlessui/react"
import { Field, Label } from "@/components/catalyst/fieldset"
import { Input } from "@/components/catalyst/input"
import { Button } from "@/components/catalyst/button"
import { Text } from "@/components/catalyst/text"
import { RocketLaunchIcon, XMarkIcon, CheckCircleIcon } from "@heroicons/react/24/outline"
import { usePostHog } from "posthog-js/react"
import { isValidEmail, normalizeEmail } from "@/lib/validation"

interface LodgeWaitlistModalProps {
  isOpen: boolean
  onClose: () => void
  quoteData: {
    workType: string
    insurableValue: number
    units: number
    premium: number
    qleave: number
  }
}

export function LodgeWaitlistModal({ isOpen, onClose, quoteData }: LodgeWaitlistModalProps) {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [emailError, setEmailError] = useState("")
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const posthog = usePostHog()

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  const total = quoteData.premium + quoteData.qleave

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
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          source: "lodge_waitlist",
          workType: quoteData.workType,
          insurableValue: quoteData.insurableValue,
          units: quoteData.units,
          premium: quoteData.premium,
          qleave: quoteData.qleave,
        }),
      })

      let data = null
      try {
        data = await response.json()
      } catch {
        data = null
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Unable to submit right now. Please try again.")
      }

      posthog?.capture('lodge_waitlist_signup', {
        email: cleanEmail,
        premium: quoteData.premium,
        total,
      })

      setIsSuccess(true)

      closeTimerRef.current = setTimeout(() => {
        setEmail("")
        setIsSuccess(false)
        onClose()
        closeTimerRef.current = null
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/25 backdrop-blur-sm" />

      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800">

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600">
                <RocketLaunchIcon className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Coming Soon!
                </DialogTitle>
                <Text className="text-sm text-zinc-600 dark:text-zinc-400">
                  Automated QBCC lodgement
                </Text>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <XMarkIcon className="size-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {isSuccess ? (
              <div className="text-center py-8">
                <CheckCircleIcon className="size-12 text-emerald-500 mx-auto mb-4" />
                <Text className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                  You&apos;re on the list!
                </Text>
                <Text className="text-sm text-zinc-600 dark:text-zinc-400">
                  We&apos;ll let you know as soon as automated lodgement is live.
                </Text>
              </div>
            ) : (
              <>
                <Text className="text-sm text-zinc-700 dark:text-zinc-300 mb-4">
                  We&apos;re building automated QBCC insurance lodgement so you never have to deal with the portal again. Leave your email to be first in line.
                </Text>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Field>
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      value={email}
                      aria-invalid={Boolean(emailError)}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (emailError) setEmailError("")
                        if (error) setError("")
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

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      onClick={onClose}
                      className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 border-0"
                    >
                      Not Now
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !email.trim()}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white border-0"
                    >
                      {isSubmitting ? "Joining..." : "Notify Me"}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
