import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";

export const feedbackRouter = Router();

const enableSchema = z.object({
  eventId: z.number().int().positive(),
  enabled: z.boolean(),
});

feedbackRouter.post("/forms", (req, res) => {
  const parsed = enableSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const { eventId, enabled } = parsed.data;

  const event = db.prepare("SELECT id FROM events WHERE id = ?").get(eventId);
  if (!event) return res.status(404).json({ error: "Event not found" });

  db.prepare(`
    INSERT INTO feedback_forms (event_id, enabled)
    VALUES (?, ?)
    ON CONFLICT(event_id)
    DO UPDATE SET enabled=excluded.enabled, updated_at=datetime('now')
  `).run(eventId, enabled ? 1 : 0);

  res.json({ ok: true });
});

const submitSchema = z.object({
  eventId: z.number().int().positive(),
  email: z.string().email(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

feedbackRouter.post("/responses", (req, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const { eventId, email, rating, comment } = parsed.data;

  const form = db.prepare("SELECT enabled FROM feedback_forms WHERE event_id = ?").get(eventId);
  if (!form || form.enabled !== 1) return res.status(400).json({ error: "Feedback not enabled for this event" });

  // Ensure user was registered
  const reg = db.prepare("SELECT 1 FROM registrations WHERE event_id = ? AND participant_email = ?").get(eventId, email);
  if (!reg) return res.status(403).json({ error: "Only registered participants can submit feedback" });

  try {
    db.prepare(`
      INSERT INTO feedback_responses (event_id, participant_email, rating, comment)
      VALUES (?, ?, ?, ?)
    `).run(eventId, email, rating, comment ?? null);

    res.status(201).json({ ok: true });
  } catch (e) {
    if (String(e).includes("UNIQUE")) {
      return res.status(409).json({ error: "Feedback already submitted for this email" });
    }
    res.status(500).json({ error: "Failed to submit feedback" });
  }
});

feedbackRouter.get("/summary", (req, res) => {
  const eventId = Number(req.query.eventId);
  if (!Number.isFinite(eventId)) return res.status(400).json({ error: "eventId is required" });

  const stats = db.prepare(`
    SELECT
      COUNT(*) AS responses,
      ROUND(AVG(rating), 2) AS avg_rating
    FROM feedback_responses
    WHERE event_id = ?
  `).get(eventId);

  const latest = db.prepare(`
    SELECT participant_email, rating, comment, submitted_at
    FROM feedback_responses
    WHERE event_id = ?
    ORDER BY datetime(submitted_at) DESC
    LIMIT 5
  `).all(eventId);

  res.json({ eventId, ...stats, latest });
});
