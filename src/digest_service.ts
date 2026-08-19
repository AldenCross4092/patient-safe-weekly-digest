import { createServer, type ServerResponse } from "node:http";
import { z } from "zod";
import { appointmentSchema, selectDigestItems, type Appointment } from "./appointment_digest.js";

const triggerSchema = z.object({}).strict();
const appointments: Appointment[] = [];

function reply(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

async function readJson(request: AsyncIterable<Uint8Array>): Promise<unknown> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of request) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

export const server = createServer(async (request, response) => {
  if (request.method !== "POST") {
    reply(response, 405, { error: "method_not_allowed" });
    return;
  }

  try {
    const body = await readJson(request);
    if (request.url === "/appointments") {
      const appointment = appointmentSchema.parse(body);
      appointments.push(appointment);
      reply(response, 202, { accepted: appointment.appointment_ref });
      return;
    }
    if (request.url === "/digests/weekly") {
      triggerSchema.parse(body);
      const items = selectDigestItems(appointments);
      reply(response, 200, { generated_at: new Date().toISOString(), item_count: items.length, items });
      return;
    }
    reply(response, 404, { error: "route_not_found" });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      reply(response, 400, { error: "invalid_request" });
      return;
    }
    reply(response, 500, { error: "service_error" });
  }
});

if (process.env.NODE_ENV !== "test") {
  const port = Number(process.env.PORT ?? 3000);
  server.listen(port, () => console.log(`digest service listening on :${port}`));
}
