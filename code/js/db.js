// src/db.js
import Database from "better-sqlite3";

export const db = new Database("eventsync.db");
db.pragma("journal_mode = WAL");

// --- Schema (includes basic Sprint 1 essentials + Sprint 2) ---
db.exec(`
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  start_time TEXT NOT NULL,      -- ISO string
  end_time TEXT,
  location TEXT,
  organizer TEXT,
  capacity INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  participant_name TEXT NOT NULL,
  participant_email TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(event_id, participant_email),
  FOREIGN KEY(event_id) REFERENCES events(id)
);

-- Sprint 2: notification preferences (per participant per event)
CREATE TABLE IF NOT EXISTS notification_prefs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  participant_email TEXT NOT NULL,
  email_opt_in INTEGER NOT NULL DEFAULT 1, -- 1 true, 0 false
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(event_id, participant_email),
  FOREIGN KEY(event_id) REFERENCES events(id)
);

-- Sprint 2: notifications sent/logged
CREATE TABLE IF NOT EXISTS notification_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER,
  participant_email TEXT,
  type TEXT NOT NULL,         -- "REMINDER" | "ORGANIZER_MESSAGE"
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL,       -- "SENT" | "FAILED"
  error TEXT,
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(event_id) REFERENCES events(id)
);

-- Sprint 2: feedback configuration per event
CREATE TABLE IF NOT EXISTS feedback_forms (
  event_id INTEGER PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(event_id) REFERENCES events(id)
);

-- Sprint 2: feedback responses
CREATE TABLE IF NOT EXISTS feedback_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  participant_email TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(event_id, participant_email),
  FOREIGN KEY(event_id) REFERENCES events(id)
);
`);

// --- Seed sample events if empty ---
const count = db.prepare("SELECT COUNT(*) AS c FROM events").get().c;
if (count === 0) {
  const ins = db.prepare(`
    INSERT INTO events (title, description, start_time, end_time, location, organizer, capacity)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  const addDays = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000).toISOString();

  ins.run("Tech Meetup", "Monthly tech meetup", addDays(7), addDays(7), "Berlin", "EventSync Org", 50);
  ins.run("Product Workshop", "Hands-on workshop", addDays(3), addDays(3), "Munich", "EventSync Org", 20);
  ins.run("Career Fair", "Networking and jobs", addDays(14), addDays(14), "Hamburg", "EventSync Org", 200);
}
