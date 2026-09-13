import {
  calculateQuote,
  QuoteInput,
  Quote,
  quotePath,
  SITE_URL,
  RATE_VERSION,
  RATE_REVIEWED,
  QBCC_SOURCE,
  QLEAVE_SOURCE,
  MAX_VALUE,
} from "./quote";
interface Tool {
  name: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean; consequentialHint: boolean };
  execute: (input: QuoteInput) => Promise<string>;
}
interface ModelContext {
  registerTool: (
    tool: Tool,
    options?: { signal: AbortSignal },
  ) => void | Promise<void>;
  unregisterTool?: (name: string) => void;
}
export function registerCalculatorTools(
  onQuote: (quote: Quote) => void,
  onError: () => void = () => {},
) {
  const context =
    (document as Document & { modelContext?: ModelContext }).modelContext ??
    (navigator as Navigator & { modelContext?: ModelContext }).modelContext;
  if (!context) return () => {};
  const controller = new AbortController();
  const tools: Tool[] = [
    {
      name: "calculate_estimate",
      description:
        "Estimate Queensland QBCC home warranty premium and QLeave levy. Updates the visible calculator only; does not buy insurance, lodge, email or save personal information. Multiple dwellings assume equal values and eligibility for notional pricing.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          workType: {
            type: "string",
            enum: ["new-construction", "renovation"],
          },
          insurableValue: {
            type: "number",
            minimum: 0,
            maximum: MAX_VALUE,
            description: "QBCC insurable value in AUD including GST",
          },
          units: { type: "integer", minimum: 1, maximum: 1000 },
          qleaveCostExGst: {
            type: "number",
            minimum: 0,
            maximum: MAX_VALUE,
            description:
              "Optional total QLeave cost of work in AUD excluding GST. Defaults to insurable value divided by 1.1.",
          },
        },
        required: ["workType", "insurableValue", "units"],
      },
      annotations: { readOnlyHint: false, consequentialHint: false },
      execute: async (input) => {
        const quote = calculateQuote(input);
        onQuote(quote);
        return JSON.stringify({
          ...quote,
          shareUrl: SITE_URL + quotePath(quote),
          sources: [QBCC_SOURCE, QLEAVE_SOURCE],
          assumptions:
            "Estimate only. Equal value per dwelling; confirm notional pricing eligibility. No insurance purchased.",
        });
      },
    },
    {
      name: "get_rate_methodology",
      description:
        "Read the rate sources, version and assumptions used by this estimator.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, consequentialHint: false },
      execute: async () =>
        JSON.stringify({
          rateVersion: RATE_VERSION,
          reviewed: RATE_REVIEWED,
          qbccEffective: "1 July 2020",
          qleaveRate: 0.00575,
          qleaveThresholdExGst: 150000,
          sources: [QBCC_SOURCE, QLEAVE_SOURCE],
        }),
    },
  ];
  for (const tool of tools) {
    try {
      Promise.resolve(
        context.registerTool(tool, { signal: controller.signal }),
      ).catch(onError);
    } catch {
      onError();
    }
  }
  return () => {
    controller.abort();
    for (const tool of tools) context.unregisterTool?.(tool.name);
  };
}
