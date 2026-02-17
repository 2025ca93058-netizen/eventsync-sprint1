import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";

export const notificationsRouter = Router();

// Fake “send email” function (replace with real email provider later)
function sendEmailSimulated(to, subject, body) {
  // Simulate failure for certain domains if you want:
  // if (to.endsWith("@fail.com")) throw new Error("Simulated email failure");
  return true;
}

const prefSchema = z.object({
  eventId: z.number().int().positive(),
  email: z.string().email(),
  emailOptIn: z.boolean(),
});

notificationsRouter.post("/preferences", (req, res) => {
  const parsed = prefSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const { eventId, email, emailOptIn } = parsed.data;

  const exists = db.prepare("SELECT id FROM events WHERE id = ?").get(eventId);
  if (!exists) return res.status(404).json({ error: "Event not found" });

  db.prepare(`
    INSERT INTO notification_prefs (event_id, participant_email, email_opt_in)
    VALUES (?, ?, ?)
    ON CONFLICT(event_id, participant_email)
    DO UPDATE SET email_opt_in=excluded.email_opt_in, updated_at=datetime('now')
  `).run(eventId, email, emailOptIn ? 1 : 0);

  res.json({ ok: true });
});

const organizerMsgSchema = z.object({
  eventId: z.number().int().positive(),
  subject: z.string().min(1),
  message: z.string().min(1),
});

notificationsRouter.post("/send", (req, res) => {
  const parsed = organizerMsgSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const { eventId, subject, message } = parsed.data;

  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(eventId);
  if (!event) return res.status(404).json({ error: "Event not found" });

  const recipients = db.prepare(`
    SELECT r.participant_email AS email
    FROM registrations r
    JOIN notification_prefs p
      ON p.event_id = r.event_id AND p.participant_email = r.participant_email
    WHERE r.event_id = ? AND p.email_opt_in = 1
  `).all(eventId);

  const body = `Event Update: ${event.title}\nWhen: ${event.start_time}\nWhere: ${event.location}\n\n${message}`;

  let sent = 0;
  let failed = 0;

  for (const r of recipients) {
    try {
      sendEmailSimulated(r.email, subject, body);
      db.prepare(`
        INSERT INTO notification_logs (event_id, participant_email, type, subject, body, status)
        VALUES (?, ?, 'ORGANIZER_MESSAGE', ?, ?, 'SENT')
      `).run(eventId, r.email, subject, body);
      sent++;
    } catch (e) {
      db.prepare(`
        INSERT INTO notification_logs (event_id, participant_email, type, subject, body, status, error)
        VALUES (?, ?, 'ORGANIZER_MESSAGE', ?, ?, 'FAILED', ?)
      `).run(eventId, r.email, subject, body, String(e));
      failed++;
    }
  }

  res.json({ ok: true, recipients: recipients.length, sent, failed });
});

notificationsRouter.get("/logs", (req, res) => {
  const eventId = Number(req.query.eventId);
  const logs = Number.isFinite(eventId)
    ? db.prepare("SELECT * FROM notification_logs WHERE event_id = ? ORDER BY datetime(sent_at) DESC").all(eventId)
    : db.prepare("SELECT * FROM notification_logs ORDER BY datetime(sent_at) DESC LIMIT 100").all();

  res.json(logs);
});
