import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { renderToStaticMarkup } from "react-dom/server";
import Page from "../app/page";
import HomeJsonLdSlot from "../app/@jsonld/page";
import robots from "../app/robots";

const require = createRequire(import.meta.url);
const { resolveRobots } = require("next/dist/build/webpack/loaders/metadata/resolve-route-data.js") as {
  resolveRobots: (data: ReturnType<typeof robots>) => string;
};

const SITE = "https://www.qbccinsurancecalculator.com.au";
const OPENING =
  "This free QBCC home warranty insurance calculator gives Queensland builders and homeowners the premium and QLeave levy for residential building work. Pick new construction or renovation, enter the insurable value including GST, and set the number of dwellings. Your estimate updates as you type. A $300,000 new home comes to $2,102.10 in premium plus a $1,568.18 QLeave levy, $3,670.28 in total. It uses the QBCC premium tables effective 1 July 2020. It is an estimate only, so confirm the final figure with QBCC.";

const FAQS = [
  {
    question: "How much does QBCC home warranty insurance cost?",
    answer:
      "It depends on the insurable value and work type. A $300,000 new home is $2,102.10 in premium, or $3,670.28 with the QLeave levy. A $300,000 renovation is $3,629.65 in premium, or $5,197.83 in total.",
  },
  {
    question: "When is QBCC insurance required?",
    answer:
      "For most residential building work in Queensland valued at over $3,300, including labour and materials.",
  },
  {
    question: "Who pays for QBCC insurance?",
    answer:
      "The licensed contractor takes out the policy and pays the premium. The cost is usually passed on to the homeowner, and it should be itemised in the building contract.",
  },
  {
    question: "Is the QLeave levy part of the QBCC premium?",
    answer:
      "No. They are separate costs. The levy is 0.575% of the GST-exclusive value and only applies once the work reaches $150,000 excluding GST.",
  },
  {
    question: "What is the difference between new construction and renovation?",
    answer:
      "New construction is a new structure from the ground up, like a house, duplex or unit. Renovation is work on an existing structure, including alterations, additions and repairs. Each uses its own premium table.",
  },
  {
    question: "How accurate is the calculator?",
    answer:
      "It uses the official QBCC premium tables effective 1 July 2020. It is for information only. Always verify the final premium with QBCC before you make financial decisions.",
  },
];

function visibleText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function jsonLdBlocks(html: string): Array<Record<string, unknown>> {
  const blocks: Array<Record<string, unknown>> = [];
  for (const match of html.matchAll(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    blocks.push(JSON.parse(match[1]) as Record<string, unknown>);
  }
  return blocks;
}

function walk(node: unknown, visit: (value: Record<string, unknown>) => void) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) walk(item, visit);
    return;
  }
  const record = node as Record<string, unknown>;
  visit(record);
  for (const value of Object.values(record)) walk(value, visit);
}

function typesOf(node: Record<string, unknown>): string[] {
  const type = node["@type"];
  if (typeof type === "string") return [type];
  if (Array.isArray(type)) return type.filter((item) => typeof item === "string");
  return [];
}

function nodesOfType(blocks: unknown, type: string): Array<Record<string, unknown>> {
  const found: Array<Record<string, unknown>> = [];
  walk(blocks, (node) => {
    if (typesOf(node).includes(type)) found.push(node);
  });
  return found;
}

test("llms.txt names the site, stays under 2 KB, and lists 3 to 5 site URLs without prices", () => {
  const bytes = readFileSync(new URL("../public/llms.txt", import.meta.url));
  const text = bytes.toString("utf8");
  assert.ok(bytes.byteLength < 2048, `llms.txt is ${bytes.byteLength} bytes`);
  assert.match(text, /QBCC Home Warranty Insurance Calculator/);
  assert.doesNotMatch(text, /\$\s?\d/);
  assert.doesNotMatch(text, /\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/);
  assert.doesNotMatch(text, /\b\d{5,}\b/);
  assert.doesNotMatch(text, /March 2026|13 September 2026/);
  assert.doesNotMatch(text, /OpenAI|ChatGPT|GPTBot|Perplexity|Claude|Gemini/i);
  assert.doesNotMatch(text, /\b(?:\+?\d[\d\s()-]{8,}\d)\b/);

  const urls = text.match(/https?:\/\/[^\s)<>"]+/g) ?? [];
  assert.ok(urls.length >= 3 && urls.length <= 5, `found ${urls.length} absolute URLs`);
  for (const url of urls) {
    assert.equal(new URL(url).hostname, "www.qbccinsurancecalculator.com.au");
  }
});

test("robots.txt allows answer-engine crawlers and keeps the sitemap", () => {
  const body = resolveRobots(robots());
  for (const agent of [
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "PerplexityBot",
    "Google-Extended",
  ]) {
    assert.match(body, new RegExp(`User-Agent: ${agent}\\nAllow: /`));
  }
  assert.match(body, /Sitemap: https:\/\/www\.qbccinsurancecalculator\.com\.au\/sitemap\.xml/);
  assert.match(body, /User-Agent: \*\nAllow: \//);
});

test("homepage answers the query in the first 100 words and publishes matching JSON-LD", () => {
  const html = `${renderToStaticMarkup(HomeJsonLdSlot())}${renderToStaticMarkup(Page())}`;
  const text = visibleText(html);
  const first100 = text.split(" ").slice(0, 100).join(" ");
  assert.match(first100, /QBCC home warranty insurance calculator/i);
  assert.ok(
    first100.includes(
      "This free QBCC home warranty insurance calculator gives Queensland builders and homeowners the premium and QLeave levy for residential building work.",
    ),
    first100,
  );
  assert.ok(first100.includes("confirm the final figure with QBCC."), first100);

  const blocks = jsonLdBlocks(html);
  assert.equal(blocks.length, 1);
  assert.equal(nodesOfType(blocks, "WebSite").length, 1);
  assert.equal(nodesOfType(blocks, "WebApplication").length, 1);
  assert.equal(nodesOfType(blocks, "Service").length, 1);
  assert.equal(nodesOfType(blocks, "FAQPage").length, 1);

  const organizations: Array<Record<string, unknown>> = [];
  walk(blocks, (node) => {
    if (typesOf(node).includes("Organization")) organizations.push(node);
  });
  const organization = organizations.find(
    (node) =>
      node.name === "QBCC Home Warranty Insurance Calculator" &&
      node.url === `${SITE}/` &&
      node.description === OPENING,
  );
  assert.ok(organization, JSON.stringify(organizations, null, 2));
  assert.ok(text.includes(String(organization?.name)));
  assert.ok(text.includes(String(organization?.description)));

  const service = nodesOfType(blocks, "Service")[0];
  assert.ok(service);
  assert.equal(service?.name, "QBCC Home Warranty Insurance Calculator");
  assert.equal(service?.areaServed, "Queensland");
  const provider = service?.provider as Record<string, unknown>;
  assert.equal(provider?.["@type"], "Organization");
  assert.equal(provider?.name, "Leva Solutions");
  assert.equal(provider?.url, "https://levasolutions.com.au");
  const offers = service?.offers as Record<string, unknown>;
  assert.equal(offers?.price, "0");
  assert.equal(offers?.priceCurrency, "AUD");
  const audience = service?.audience as Record<string, unknown>;
  assert.match(String(audience?.audienceType), /builders/i);
  assert.match(String(audience?.audienceType), /homeowners/i);
  assert.match(String(audience?.audienceType), /construction industry/i);

  const faqPage = nodesOfType(blocks, "FAQPage")[0];
  assert.ok(faqPage);
  const mainEntity = faqPage?.mainEntity as Array<Record<string, unknown>>;
  assert.equal(mainEntity.length, FAQS.length);
  for (const [index, faq] of FAQS.entries()) {
    const entity = mainEntity[index];
    const answer = entity?.acceptedAnswer as Record<string, unknown>;
    assert.equal(entity?.name, faq.question);
    assert.equal(answer?.text, faq.answer);
    assert.ok(text.includes(faq.question), faq.question);
    assert.ok(text.includes(faq.answer), faq.answer);
  }

  assert.doesNotMatch(text, /qbcc-home-warranty-insurance-calculator/);
  assert.doesNotMatch(OPENING, /March 2026|13 September 2026/);
  for (const faq of FAQS) {
    assert.doesNotMatch(`${faq.question} ${faq.answer}`, /March 2026|13 September 2026/);
    assert.doesNotMatch(`${faq.question} ${faq.answer}`, /OpenAI|ChatGPT|Perplexity|Claude|Gemini/i);
  }
});

test("homepage JSON-LD is not replaced by Tendrank, a static schema file, or the root layout", () => {
  const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const homeSlot = readFileSync(new URL("../app/@jsonld/page.tsx", import.meta.url), "utf8");
  const homePayload = readFileSync(new URL("../.tendrank/content/home.html", import.meta.url), "utf8");

  assert.equal((page.match(/application\/ld\+json/g) ?? []).length, 1);
  assert.doesNotMatch(page, /getTendrankPageOverlay|tendrank|site-schema/);
  assert.doesNotMatch(layout, /application\/ld\+json/);
  assert.match(layout, /\{jsonld\}/);
  assert.match(homeSlot, /return null/);
  assert.equal(existsSync(new URL("../middleware.ts", import.meta.url)), false);
  assert.match(homePayload, /"target_path": "\/home"/);
  assert.doesNotMatch(homePayload, /"target_path": "\/"/);
  assert.equal(existsSync(new URL("../public/site-schema.json", import.meta.url)), true);
  assert.doesNotMatch(page, /site-schema\.json/);
  assert.doesNotMatch(layout, /site-schema\.json/);
});

test("homepage keeps its title and sitemap entry, without the suggested slug", () => {
  const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const sitemap = readFileSync(new URL("../app/sitemap.ts", import.meta.url), "utf8");
  assert.match(layout, /title: "QBCC Home Warranty Insurance Calculator \| Premium Estimator"/);
  assert.match(sitemap, /url: BASE_URL\b/);
  assert.doesNotMatch(sitemap, /qbcc-home-warranty-insurance-calculator/);
  assert.equal(existsSync(new URL("../app/qbcc-home-warranty-insurance-calculator/page.tsx", import.meta.url)), false);
});
