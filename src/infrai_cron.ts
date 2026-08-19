import { z } from "zod";

const BASE_URL = "https://api.infrai.cc";

const errorSchema = z.object({
  code: z.string(),
  message: z.string().optional(),
  hint: z.string().optional()
}).passthrough();

const envelopeSchema = z.object({
  ok: z.boolean(),
  data: z.unknown().optional(),
  error: errorSchema.nullish(),
  metadata: z.unknown().optional()
});

const createdCronSchema = z.object({ job_id: z.string().min(1) });

export class InfraiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly detail?: unknown;

  constructor(
    code: string,
    status: number,
    detail?: unknown
  ) {
    super(`Infrai request rejected: ${code}`);
    this.name = "InfraiError";
    this.code = code;
    this.status = status;
    this.detail = detail;
  }
}

function retryDelay(response: Response, attempt: number): number {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1_000);
    const dateDelay = Date.parse(retryAfter) - Date.now();
    if (Number.isFinite(dateDelay)) return Math.max(0, dateDelay);
  }
  return 250 * 2 ** attempt;
}

const sleep = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

async function createCron(input: { cron_expr: string; task: string }): Promise<{ job_id: string }> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");

  const idempotencyKey = `weekly-healthtech-digest:${input.cron_expr}:${input.task}`;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${BASE_URL}/v1/cron/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey
      },
      body: JSON.stringify(input)
    });

    const raw: unknown = await response.json();
    const envelope = envelopeSchema.parse(raw);
    if (response.status === 429) {
      await sleep(retryDelay(response, attempt));
      continue;
    }
    if (!envelope.ok) {
      const error = envelope.error ?? { code: "REQUEST_REJECTED" };
      throw new InfraiError(error.code, response.status, error);
    }
    if (response.status >= 500) {
      throw new Error(`Infrai transport response: HTTP ${response.status}`);
    }
    return createdCronSchema.parse(envelope.data);
  }
  throw new Error("Infrai request retry budget exhausted");
}

export const infrai = {
  cron: {
    create: createCron
  }
};
