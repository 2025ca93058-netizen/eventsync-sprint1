// src/scheduler.js
import cron from "node-cron";
import { db } from "./db.js";

function sendEmailSimulated(to, subject, body) {
  return true;
}

// Every 5 minutes: find events starting in ~24h (window: 24h to 24h+5m)
cron.schedule("*/5 * * * *", () => {
  const now = new Date();
  const from = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const to = new Date(from.getTime() + 5 * 60 * 1000);

  const rows = db.prepare(`
    SELECT e.id AS event_id, e.title, e.start_time, e.location, r.participant_email
    FROM events e
    JOIN registrations r ON r.event_id = e.id
    JOIN notification_prefs p
      ON p.event_id = e.id AND p.participant_email = r.participant_email
    WHERE p.email_opt_in = 1
      AND datetime(e.start_time) >= datetime(?)
      AND datetime(e.start_time) < datetime(?)
  `).all(from.toISOString(), to.toISOString());

  for (const row of rows) {
    const subject = `Reminder: ${row.title} is in 24 hours`;
    const body = `Hi!\n\nThis is a reminder for:\n${row.title}\nWhen: ${row.start_time}\nWhere: ${row.location}\n\nSee you there!`;

    // Prevent duplicates: if already sent reminder log for this user+event in last 2 days, skip
    const exists = db.prepare(`
      SELECT 1 FROM notification_logs
      WHERE event_id = ? AND participant_email = ? AND type = 'REMINDER'
        AND datetime(sent_at) >= datetime('now', '-2 days')
      LIMIT 1
    `).get(row.event_id, row.participant_email);

    if (exists) continue;

    try {
      sendEmailSimulated(row.participant_email, subject, body);
      db.prepare(`
        INSERT INTO notification_logs (event_id, participant_email, type, subject, body, status)
        VALUES (?, ?, 'REMINDER', ?, ?, 'SENT')
      `).run(row.event_id, row.participant_email, subject, body);
    } catch (e) {
      db.prepare(`
        INSERT INTO notification_logs (event_id, participant_email, type, subject, body, status, error)
        VALUES (?, ?, 'REMINDER', ?, ?, 'FAILED', ?)
      `).run(row.event_id, row.participant_email, subject, body, String(e));
    }
  }
});
