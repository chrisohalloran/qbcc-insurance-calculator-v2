"use client"

import { useEffect, useRef, useState } from "react"
import { Dialog, DialogPanel, DialogTitle, DialogBackdrop } from "@headlessui/react"
import { Field, Label } from "@/components/catalyst/fieldset"
import { Input } from "@/components/catalyst/input"
import { Button } from "@/components/catalyst/button"
import { Text } from "@/components/catalyst/text"
import { EnvelopeIcon, XMarkIcon, CheckCircleIcon } from "@heroicons/react/24/outline"
import { LeadCaptureRequest, ApiResponse } from "@/lib/types"
import { track } from "@vercel/analytics"
import { isValidEmail, normalizeEmail } from "@/lib/validation"

interface LeadCaptureModalProps {
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

export function LeadCaptureModal({ isOpen, onClose, quoteData }: LeadCaptureModalProps) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [emailError, setEmailError] = useState("")
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

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
        name: name || undefined,
        phone: phone || undefined,
        source: "post-calculation",
        workType: quoteData.workType,
        insurableValue: quoteData.insurableValue,
        units: quoteData.units,
        premium: quoteData.premium,
        qleave: quoteData.qleave
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
      track("email_signup")

      // Reset form after delay
      closeTimerRef.current = setTimeout(() => {
        setEmail("")
        setName("")
        setPhone("")
        setIsSuccess(false)
        onClose()
        closeTimerRef.current = null
      }, 2000)

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
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
      
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-leva-orange/10 rounded-lg text-leva-orange">
                <EnvelopeIcon className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Get Your Quote Emailed
                </DialogTitle>
                <Text className="text-sm text-zinc-600 dark:text-zinc-400">
                  Save this estimate for your records
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

          {/* Quote Summary */}
          <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50">
            <div className="flex justify-between items-center">
              <Text className="text-sm font-medium">Total Estimate:</Text>
              <Text className="text-lg font-bold text-leva-navy dark:text-white">
                {formatCurrency(quoteData.premium + quoteData.qleave)}
              </Text>
            </div>
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {quoteData.workType === "new-construction" ? "New Construction" : "Renovation"} • 
              {" "}{formatCurrency(quoteData.insurableValue)} • 
              {" "}{quoteData.units} unit{quoteData.units !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Form */}
          <div className="p-6">
            {isSuccess ? (
              <div className="text-center py-8">
                <CheckCircleIcon className="size-12 text-green-500 mx-auto mb-4" />
                <Text className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                  Quote Sent!
                </Text>
                <Text className="text-sm text-zinc-600 dark:text-zinc-400">
                  Check your email for your premium estimate.
                </Text>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Field>
                  <Label>Email Address *</Label>
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

                <Field>
                  <Label>Name (optional)</Label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (error) {
                        setError("")
                      }
                    }}
                    placeholder="Your name"
                  />
                </Field>

                <Field>
                  <Label>Phone (optional)</Label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value)
                      if (error) {
                        setError("")
                      }
                    }}
                    placeholder="0400 000 000"
                  />
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
                    Maybe Later
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !email.trim()}
                    className="flex-1 bg-leva-orange hover:bg-leva-orange-light text-white border-0"
                  >
                    {isSubmitting ? "Sending..." : "Send Quote"}
                  </Button>
                </div>

                <Text className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                  We'll only email you this quote. No spam, ever.
                </Text>
              </form>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
