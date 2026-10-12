# GA4 / GTM conversion events

Production container `GTM-MBLZJ6T2` already loads Google tag `G-HFTV8CW3HR` (GA4 property `481460830`). The app must not add a second `gtag('config', 'G-HFTV8CW3HR')` when that container is present.

`lib/analytics.ts` `captureEvent()` is the only client writer. It fans out to PostHog, Vercel Analytics, `gtag('event', …)` when `window.gtag` exists, and **always** pushes `{ event, …params }` onto `window.dataLayer` so GTM Custom Event triggers fire even if `gtag` is present.

Do not send email, name, phone, distinct IDs, or the raw contract / insurable value on these GA4 conversion events.

## Events

| Event | When it fires | Parameters |
| --- | --- | --- |
| `calculator_started` | First human input on the calculator | none |
| `calculator_completed` | First successful estimate | `premium_value` (number, QBCC premium AUD), `currency`: `"AUD"`, `contract_value_band` |
| `cta_click` | Quote, referral, and affiliate CTAs | `cta_id`, `cta_location` |
| `quote_click` | Quote CTAs only (also fires `cta_click`) | `cta_id`, `cta_location` |
| `generate_lead` | Successful lead or email form submit | `form_id`, `value_band` only |

`contract_value_band` / generate-lead `value_band` use the same contract-value buckets. The raw contract value is not sent.

| Contract value (AUD) | Band |
| --- | --- |
| `< 20,000` | `<20k` |
| `20,000`–`< 100,000` | `20-100k` |
| `100,000`–`< 300,000` | `100-300k` |
| `300,000`–`< 1,000,000` | `300k-1m` |
| `≥ 1,000,000` | `1m+` |

### CTA ids and locations

| Surface | `cta_id` | `cta_location` | Events |
| --- | --- | --- | --- |
| Email my quote | `email_quote` | `calculator_result` | `cta_click`, `quote_click` |
| Estimate-page email form | `email_quote` | `estimate_page` | `cta_click`, `quote_click` |
| Contextual email-quote offer | offer id (e.g. `qbcc_new_build_quote_record`) | `contextual_offer` | `cta_click`, `quote_click` |
| Trade Solar offer (affiliate) | `trade_solar_new_build` | `contextual_offer` | `cta_click` |
| Leva Relay offer (referral) | `leva_relay_renovation_pipeline` | `contextual_offer` | `cta_click` |
| Content-page Relay CTA (referral) | `leva_relay` | `content_page` | `cta_click` |

### Lead form ids

| Form | `form_id` |
| --- | --- |
| Calculator email-quote modal | `email_quote` |
| Shared-estimate email form | `estimate_email_quote` |
| Project-info prep waitlist | `draft_prep_waitlist` |

Existing PostHog events (`calculation_completed`, `email_quote_submitted`, and the rest) stay in place and may still carry quote segmentation. They are not the GA4 conversion contract.

## GTM tags and triggers

Do **not** add another GA4 Configuration / Google tag for `G-HFTV8CW3HR`. Use the Google tag already in `GTM-MBLZJ6T2`.

Create one Custom Event trigger and one GA4 Event tag per row. Event name and parameter names must match the dataLayer payload exactly.

| Trigger (Custom Event name) | GA4 Event tag | Event parameters to include |
| --- | --- | --- |
| `calculator_started` | GA4 Event `calculator_started` | — |
| `calculator_completed` | GA4 Event `calculator_completed` | `premium_value`, `currency`, `contract_value_band` |
| `cta_click` | GA4 Event `cta_click` | `cta_id`, `cta_location` |
| `quote_click` | GA4 Event `quote_click` | `cta_id`, `cta_location` |
| `generate_lead` | GA4 Event `generate_lead` | `form_id`, `value_band` |

In GA4 Admin → Events, mark `generate_lead` as a key event / conversion. Optionally mark `calculator_completed` and `quote_click` the same way.

Preview in GTM Tag Assistant and confirm each named object appears on `window.dataLayer` before publishing.

## Local check

With `NEXT_PUBLIC_GTM_ID=GTM-MBLZJ6T2`, the layout loads GTM and skips the standalone `GoogleAnalytics` config. In DevTools:

```js
window.dataLayer.filter((item) => item && typeof item === "object" && "event" in item)
```
