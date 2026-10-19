import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy | QBCC Calculator",
  description:
    "How Striking Group collects, uses and stores information from the QBCC Home Warranty Insurance Calculator.",
  alternates: {
    canonical: "https://www.qbccinsurancecalculator.com.au/privacy",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-leva-grey-pale dark:bg-zinc-950">
      <div className="container mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-sm">
          <Link href="/" className="underline underline-offset-2">
            Back to the calculator
          </Link>
        </p>

        <article className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 sm:p-10 dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-3xl font-bold tracking-tight text-leva-navy dark:text-white">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Last updated 19 October 2026
          </p>

          <div className="mt-8 space-y-6 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-leva-navy dark:text-white">
                Who we are
              </h2>
              <p>
                This website is operated by Striking Group. We provide a free
                QBCC home warranty insurance and QLeave estimate tool for
                builders, trades and homeowners in Queensland.
              </p>
              <p>
                {/* TODO: replace with the registered legal entity name and ABN. */}
                The registered legal entity name and ABN for Striking Group
                will be published here once confirmed.
              </p>
              <p>
                This policy explains how we handle personal information in line
                with the Australian Privacy Principles in the Privacy Act 1988
                (Cth).
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-leva-navy dark:text-white">
                What we collect
              </h2>
              <p>We may collect:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  Calculator inputs, such as work type, insurable value, number
                  of dwellings, QLeave cost of work, and the estimate we show
                  you.
                </li>
                <li>
                  Contact details you type into a quote or waitlist form,
                  including your email, and any name or phone number you enter.
                  If you type a valid email and then leave or close the form
                  without sending it, we may still save that address and any
                  name or phone number already typed so we can follow up about
                  the quote.
                </li>
                <li>
                  A random session identifier stored in your browser for this
                  visit, so we can connect calculator use with a later quote
                  request.
                </li>
                <li>
                  Usage and device information through analytics tools:
                  Google Analytics and Google Tag Manager, PostHog, and Vercel
                  Analytics.
                </li>
              </ul>
              <p>
                We do not ask for payment card details on this site. The
                calculator does not lodge insurance or create a QBCC account.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-leva-navy dark:text-white">
                Why we collect it
              </h2>
              <p>We collect this information to:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Calculate and show your estimate.</li>
                <li>
                  Email you a quote when you ask for one, and contact you about
                  that quote or related help with QBCC or QLeave estimates.
                </li>
                <li>
                  Keep abandoned or incomplete form details so we can follow up
                  if you started a quote request.
                </li>
                <li>
                  Understand how the calculator is used, fix problems, and
                  improve the site.
                </li>
              </ul>
              <p>
                If you do not want us to save or use your email, do not enter
                it in the form. You can also contact us and ask us to delete it.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-leva-navy dark:text-white">
                How we store and share information
              </h2>
              <p>
                Calculator runs and contact details are stored in our own
                database hosted with Vercel Postgres (Neon) in cloud
                infrastructure. Quote emails are sent through our email
                provider, Resend. We may also send a copy of a submitted lead
                to an operator inbox or a connected webhook if one is
                configured.
              </p>
              <p>
                Some of this processing happens outside Australia. Resend
                processes quote emails in the United States. Calculator runs
                and contact details are stored by Neon, the database provider
                for Vercel Postgres.
              </p>
              <p>
                Analytics data is processed by Google (Analytics and Tag
                Manager), PostHog, and Vercel. Those services may store
                information outside Australia, including in the United States.
                We do not sell your contact details.
              </p>
              <p>
                If you start a quote form but don't send it, we delete those details after 90 days. We keep quote requests you send for up to 2 years after we last contact you, then delete them. Calculator runs linked to your details are deleted with them, and other calculator runs are deleted after 2 years.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-leva-navy dark:text-white">
                Access, correction and complaints
              </h2>
              <p>
                You can ask us for a copy of the personal information we hold
                about you, and you can ask us to correct or delete it. Send
                your request to{" "}
                <a
                  href="mailto:chris@strikinggroup.com.au"
                  className="underline underline-offset-2"
                >
                  chris@strikinggroup.com.au
                </a>
                .
              </p>
              <p>
                If you have a privacy complaint, contact us first and we will
                try to resolve it. If you are not satisfied, you can contact
                the Office of the Australian Information Commissioner at{" "}
                <a
                  href="https://www.oaic.gov.au"
                  className="underline underline-offset-2"
                  target="_blank"
                  rel="noreferrer"
                >
                  oaic.gov.au
                </a>
                .
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-leva-navy dark:text-white">
                Contact
              </h2>
              <p>
                Privacy questions and requests:{" "}
                <a
                  href="mailto:chris@strikinggroup.com.au"
                  className="underline underline-offset-2"
                >
                  chris@strikinggroup.com.au
                </a>
              </p>
              <p>Striking Group, Australia.</p>
            </section>
          </div>
        </article>
      </div>
    </main>
  )
}
