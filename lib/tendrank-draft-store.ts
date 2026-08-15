export type ReceiverDraftStatus = "review" | "published" | "archived"

export type ReceiverDraft = {
  id: string
  idempotency_key: string
  source: "tendrank"
  site_domain: string
  source_site_id: string
  source_post_id: string | null
  source_session_id: string | null
  slug: string
  action_type: string
  status: ReceiverDraftStatus
  title: string
  target_path: string
  meta_description: string | null
  html_body: string
  json_ld: string | null
  brief: string | null
  updated_at: string
}

type Store = {
  byId: Map<string, ReceiverDraft>
  byKey: Map<string, string>
}

const globalStore = globalThis as typeof globalThis & {
  __qbccTendrankDrafts?: Store
}

function store(): Store {
  if (!globalStore.__qbccTendrankDrafts) {
    globalStore.__qbccTendrankDrafts = {
      byId: new Map(),
      byKey: new Map(),
    }
  }

  return globalStore.__qbccTendrankDrafts
}

export function resetReceiverDrafts(): void {
  const current = store()
  current.byId.clear()
  current.byKey.clear()
}

export function getDraftById(id: string): ReceiverDraft | null {
  return store().byId.get(id) ?? null
}

export function getDraftByIdempotencyKey(key: string): ReceiverDraft | null {
  const id = store().byKey.get(key)
  return id ? getDraftById(id) : null
}

export function getPublishedDraftBySlug(slug: string): ReceiverDraft | null {
  let latest: ReceiverDraft | null = null

  for (const draft of store().byId.values()) {
    if (draft.slug !== slug || draft.status !== "published") continue
    if (!latest || draft.updated_at > latest.updated_at) latest = draft
  }

  return latest
}

export function putDraft(draft: ReceiverDraft): ReceiverDraft {
  const current = store()
  current.byId.set(draft.id, draft)
  current.byKey.set(draft.idempotency_key, draft.id)
  return draft
}
