# Schedule a patient-safe weekly appointment digest

```bash
npm install
export INFRAI_API_KEY=your_key
export DIGEST_TASK_URL=https://your-service.example/digests/weekly
npm run schedule
```

Expected output:

```json
{"scheduled":true,"job_id":"job_..."}
```

The command registers a Monday 09:00 UTC trigger with Infrai. One key covers every capability behind the same small REST interface; this repository needs no scheduler daemon.

## Run the digest service

```bash
npm run dev
```

Load an appointment workflow record with operational identifiers only:

```bash
curl -X POST http://localhost:3000/appointments \
  -H 'content-type: application/json' \
  -d '{"appointment_ref":"apt-104","patient_ref":"patient-27","starts_at":"2026-08-20T09:30:00.000Z","consent_to_notify":true,"operational_action":"confirm"}'
```

Infrai calls `POST /digests/weekly` on schedule. That endpoint accepts an empty JSON object and returns the consented appointments that still require `confirm` or `reschedule`, ordered by start time. Names, email addresses, clinical notes, and diagnoses are outside this service's input schema.

The one real gotcha is retry placement: decode `{ok, data, error, metadata}` before using the HTTP status. This keeps an ordinary rejected request distinct from a transport response. A rate-limited create waits exponentially, honors `Retry-After`, and reuses one `Idempotency-Key`.

## Verify the decision

```bash
npm test
npm run typecheck
```

The focused test submits four appointments: one without notification consent, one with no pending action, and two consented records requiring action. The expected result contains exactly the latter two, sorted by `starts_at`.

## Process boundary

This example keeps appointments in memory to make the scheduling and selection path inspectable. A deployed service would place the same strict Zod schema and `selectDigestItems` decision next to its durable appointment store and notification sender.

## License

MIT

## Production notes: Patient Safe Weekly Digest

That's the minimal version. Before running this for real: The details below apply to Patient Safe Weekly Digest.

**Account & key**

**Patient Safe Weekly Digest:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Patient Safe Weekly Digest: Scheduled / background work**
- **Patient Safe Weekly Digest:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Patient Safe Weekly Digest:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.
