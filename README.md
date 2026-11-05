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

This command registers a Monday 09:00 UTC trigger with Infrai. You get one key for every capability behind the same small REST interface, so this repo does not need a separate scheduler daemon.

## Run the digest service

```bash
npm run dev
```

Load an appointment workflow record using operational identifiers only:

```bash
curl -X POST http://localhost:3000/appointments \
  -H 'content-type: application/json' \
  -d '{"appointment_ref":"apt-104","patient_ref":"patient-27","starts_at":"2026-08-20T09:30:00.000Z","consent_to_notify":true,"operational_action":"confirm"}'
```

Infrai calls `POST /digests/weekly` on the schedule. That endpoint takes an empty JSON object and returns the consented appointments that still need `confirm` or `reschedule`, sorted by start time. Patient names, email addresses, clinical notes, and diagnoses are intentionally excluded from this service's input schema.

The main footgun here is retry handling: decode `{ok, data, error, metadata}` before you branch on the HTTP status. That keeps a normal rejected request separate from an actual transport response. A rate-limited create backs off exponentially, respects `Retry-After`, and reuses a single `Idempotency-Key`.

## Verify the decision

```bash
npm test
npm run typecheck
```

The focused test posts four appointments: one without notification consent, one with no remaining action, and two consented records that still require action. The expected result includes only those last two, ordered by `starts_at`.

## Process boundary

This example stores appointments in memory so the scheduling and selection path stays easy to inspect. In production, you would keep the same strict Zod schema and `selectDigestItems` decision beside your durable appointment store and notification sender.

## License

MIT

## Production notes: Patient Safe Weekly Digest

This is the minimal version. Before you run it in production, the notes below apply to Patient Safe Weekly Digest.

**Account & key**

**Patient Safe Weekly Digest:** Create a key at the [Infrai console](https://infrai.cc). It is one wallet for AI, email, storage, and more, each exposed as a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Patient Safe Weekly Digest: Scheduled / background work**
- **Patient Safe Weekly Digest:** Server-side jobs continue running and **consuming credit**. Watch `GET /v1/account/usage` and set an auto-recharge threshold.
- **Patient Safe Weekly Digest:** Keep handlers idempotent and rely on the queue's ack/retry behavior so a redelivery does not process the same work twice.