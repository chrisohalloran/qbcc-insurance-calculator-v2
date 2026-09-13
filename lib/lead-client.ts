const submissions = new Map<string, string>();
export function leadFetch(url: string, init: RequestInit) {
  const body = String(init.body ?? "");
  if (!submissions.has(body)) submissions.set(body, crypto.randomUUID());
  if (submissions.size > 30)
    submissions.delete(submissions.keys().next().value!);
  return fetch(url, {
    ...init,
    headers: { ...init.headers, "Idempotency-Key": submissions.get(body)! },
    signal: AbortSignal.timeout(25000),
  });
}
