import { z } from "zod";

export const appointmentSchema = z.object({
  appointment_ref: z.string().min(1).max(80),
  patient_ref: z.string().min(1).max(80),
  starts_at: z.string().datetime(),
  consent_to_notify: z.boolean(),
  operational_action: z.enum(["confirm", "reschedule", "none"])
}).strict();

export type Appointment = z.infer<typeof appointmentSchema>;

export type DigestItem = {
  appointment_ref: string;
  patient_ref: string;
  starts_at: string;
  action: "confirm" | "reschedule";
};

export function selectDigestItems(appointments: readonly Appointment[]): DigestItem[] {
  return appointments
    .filter((item) => item.consent_to_notify && item.operational_action !== "none")
    .sort((left, right) => left.starts_at.localeCompare(right.starts_at))
    .map((item) => ({
      appointment_ref: item.appointment_ref,
      patient_ref: item.patient_ref,
      starts_at: item.starts_at,
      action: item.operational_action as DigestItem["action"]
    }));
}
