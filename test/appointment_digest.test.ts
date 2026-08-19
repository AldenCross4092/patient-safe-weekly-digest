import { describe, expect, it } from "vitest";
import { selectDigestItems, type Appointment } from "../src/appointment_digest.js";

describe("weekly appointment digest", () => {
  it("includes only consented appointments that need an operational action", () => {
    const appointments: Appointment[] = [
      {
        appointment_ref: "apt-later",
        patient_ref: "patient-17",
        starts_at: "2026-08-20T15:00:00.000Z",
        consent_to_notify: true,
        operational_action: "reschedule"
      },
      {
        appointment_ref: "apt-private",
        patient_ref: "patient-29",
        starts_at: "2026-08-19T10:00:00.000Z",
        consent_to_notify: false,
        operational_action: "confirm"
      },
      {
        appointment_ref: "apt-ready",
        patient_ref: "patient-11",
        starts_at: "2026-08-18T09:00:00.000Z",
        consent_to_notify: true,
        operational_action: "confirm"
      },
      {
        appointment_ref: "apt-settled",
        patient_ref: "patient-31",
        starts_at: "2026-08-17T12:00:00.000Z",
        consent_to_notify: true,
        operational_action: "none"
      }
    ];

    expect(selectDigestItems(appointments)).toEqual([
      {
        appointment_ref: "apt-ready",
        patient_ref: "patient-11",
        starts_at: "2026-08-18T09:00:00.000Z",
        action: "confirm"
      },
      {
        appointment_ref: "apt-later",
        patient_ref: "patient-17",
        starts_at: "2026-08-20T15:00:00.000Z",
        action: "reschedule"
      }
    ]);
  });
});
