import { Router } from "express";
import { db } from "../db.js";

export const analyticsRouter = Router();

/**
 * GET /api/analytics/overview?from=ISO&to=ISO
 * If from/to not provided, returns all-time.
 */
analyticsRouter.get("/overview", (req, res) => {
  const from = req.query.from ? String(req.query.from) : null;
  const to = req.query.to ? String(req.query.to) : null;

  // Events filtered by date range (start_time)
  const events = from && to
    ? db.prepare(`
        SELECT * FROM events
        WHERE datetime(start_time) >= datetime(?)
          AND datetime(start_time) < datetime(?)
        ORDER BY datetime(start_time) ASC
      `).all(from, to)
    : db.prepare(`SELECT * FROM events ORDER BY datetime(start_time) ASC`).all();

  const results = events.map((e) => {
    const registrations = db.prepare(`SELECT COUNT(*) AS c FROM registrations WHERE event_id = ?`).get(e.id).c;

    const feedback = db.prepare(`
      SELECT COUNT(*) AS responses, ROUND(AVG(rating), 2) AS avg_rating
      FROM feedback_responses
      WHERE event_id = ?
    `).get(e.id);

    const notif = db.prepare(`
      SELECT
        SUM(CASE WHEN status='SENT' THEN 1 ELSE 0 END) AS sent,
        SUM(CASE WHEN status='FAILED' THEN 1 ELSE 0 END) AS failed
      FROM notification_logs
      WHERE event_id = ?
    `).get(e.id);

    return {
      eventId: e.id,
      title: e.title,
      start_time: e.start_time,
      location: e.location,
      registrations,
      feedback: {
        responses: feedback.responses ?? 0,
        avg_rating: feedback.avg_rating ?? null,
      },
      notifications: {
        sent: notif.sent ?? 0,
        failed: notif.failed ?? 0,
      },
    };
  });

  res.json({ from, to, events: results });
});
