# QBCC Home Warranty Insurance Calculator

A Next.js calculator for estimating Queensland QBCC home warranty insurance premiums and QLeave levy amounts. It also captures calculator-intent leads and shows contextual next-step offers based on the user's project type and value band.

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

```bash
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_POSTHOG_KEY=phc_your_project_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

RESEND_API_KEY=re_your_key_here
LEAD_NOTIFICATION_EMAIL=chris@strikinggroup.com.au
LEAD_EMAIL_FROM=QBCC Calculator <quotes@mail.levasolutions.com.au>
LEAD_EMAIL_REPLY_TO=chris@strikinggroup.com.au

LEADS_WEBHOOK_URL=https://example.com/qbcc-leads
LEADS_WEBHOOK_SECRET=change-me
LEADS_STORAGE_MODE=local
LEADS_DATA_DIR=/tmp/qbcc-calculator-local-data
```

Production lead persistence requires either Resend email delivery (`RESEND_API_KEY` + `LEAD_NOTIFICATION_EMAIL`) or `LEADS_WEBHOOK_URL`. Local JSON storage is useful for development, but it is not durable on Vercel production. `LEADS_DATA_DIR` is honored only when `LEADS_STORAGE_MODE=local`, allowing smoke tests to use isolated temporary storage without redirecting normal production persistence.

## Lead Capture Loop

The calculator enriches each quote with:

- Work type, insurable value, units, QBCC premium, QLeave levy, and total estimate.
- Value band, project segment, QLeave applicability, and the recommended offer shown.
- A server-generated opaque lead reference and explicit `pending_review` state shared by the API receipt and lead records.
- Non-PII PostHog submission properties for the opaque reference, review state, and quote segmentation; email, name, phone, and browser distinct ID are not used for lead identification in PostHog.

Current contextual offers are intentionally native to the calculator:

- New-build projects above the QLeave threshold show a Trade Solar offer.
- Renovation pipeline projects show a Leva Relay offer.
- Smaller or multi-unit projects bias toward emailing a quote pack for follow-up.

## Verification

```bash
npm run nuroc:preflight
npx tsc --noEmit
npm run build
npm run nuroc:lead-api-smoke
npm run lint
```

The lead API smoke boots the built app on loopback, removes Resend and webhook variables from the child process, uses an `example.com` address with temporary local storage, verifies invalid-request rejection and the opaque-reference/review-state round trip, then deletes the temporary data. For browser verification, start the app locally, calculate a new-build and renovation quote, confirm the contextual offer changes, and submit only a controlled test lead in development mode.

## Deployment

The app is deployed on Vercel:

- `main`: production
- `staging`: staging or preview validation

Before calling a production deploy complete, verify the canonical production URL loads the expected calculator and that lead capture posts to the configured webhook.
