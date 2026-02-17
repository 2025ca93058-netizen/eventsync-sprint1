import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";

export const registrationsRouter = Router();

const registerSchema = z.object({
  eventId: z.number().int().positive(),
  name: z.string().min(1),
  email: z.string().email(),
  emailOptIn: z.boolean().optional().default(true),
});

registrationsRouter.post("/", (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const { eventId, name, email, emailOptIn } = parsed.data;

  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(eventId);
  if (!event) return res.status(404).json({ error: "Event not found" });

  const regCount = db.prepare("SELECT COUNT(*) AS c FROM registrations WHERE event_id = ?").get(eventId).c;
  if (regCount >= event.capacity) return res.status(409).json({ error: "Event is full" });

  try {
    db.prepare(`
      INSERT INTO registrations (event_id, participant_name, participant_email)
      VALUES (?, ?, ?)
    `).run(eventId, name, email);

    // Ensure notification preference row exists
    db.prepare(`
      INSERT INTO notification_prefs (event_id, participant_email, email_opt_in)
      VALUES (?, ?, ?)
      ON CONFLICT(event_id, participant_email)
      DO UPDATE SET email_opt_in=excluded.email_opt_in, updated_at=datetime('now')
    `).run(eventId, email, emailOptIn ? 1 : 0);

    res.status(201).json({ ok: true });
  } catch (e) {
    if (String(e).includes("UNIQUE")) {
      return res.status(409).json({ error: "Already registered with this email" });
    }
    res.status(500).json({ error: "Registration failed" });
  }
});
