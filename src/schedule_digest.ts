import { infrai } from "./infrai_cron.js";

const task = process.env.DIGEST_TASK_URL;
if (!task) throw new Error("DIGEST_TASK_URL is required");

const result = await infrai.cron.create({
  cron_expr: "0 9 * * 1",
  task
});

console.log(JSON.stringify({ scheduled: true, job_id: result.job_id }));
