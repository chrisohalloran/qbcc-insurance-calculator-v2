export class PartialLeadDeliveryError extends Error {
  constructor() {
    super("Partial leads are not emailed, exported, or added to a sequence");
    this.name = "PartialLeadDeliveryError";
  }
}

export function assertDeliverableLead(lead: object) {
  if ("status" in lead && lead.status === "partial") {
    throw new PartialLeadDeliveryError();
  }
}
