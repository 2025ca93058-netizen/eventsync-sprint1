import request from "supertest";
import express from "express";

process.env.DB_PATH = ":memory:";

import { db } from "../src/db.js";
import { registrationsRouter } from "../src/routes/registrations.js";
import { notificationsRouter } from "../src/routes/notifications.js";
import { eventsRouter } from "../src/routes/events.js";

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/events", eventsRouter);
  app.use("/api/registrations", registrationsRouter);
  app.use("/api/notifications", notificationsRouter);
  return app;
}

describe("Sprint 2 - Notifications APIs", () => {
  let app;

  beforeAll(() => {
    app = makeApp();

    db.prepare(`
      INSERT INTO events (title, description, start_time, end_time, location, organizer, capacity)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      "Notify Event",
      "Desc",
      "2026-02-15T10:00:00.000Z",
      "2026-02-15T12:00:00.000Z",
      "Mumbai",
      "EventSync",
      10
    );
  });

  afterAll(() => db.close());

  test("participant can register with emailOptIn=true (preference stored)", async () => {
    const res = await request(app)
      .post("/api/registrations")
      .send({ eventId: 1, name: "Alex", email: "alex@mail.com", emailOptIn: true });

    expect([201, 200]).toContain(res.statusCode);

    const pref = db.prepare(`
      SELECT email_opt_in FROM notification_prefs WHERE event_id = ? AND participant_email = ?
    `).get(1, "alex@mail.com");

    expect(pref).toBeTruthy();
    expect(pref.email_opt_in).toBe(1);
  });

  test("participant can opt-out via preferences endpoint", async () => {
    const res = await request(app)
      .post("/api/notifications/preferences")
      .send({ eventId: 1, email: "alex@mail.com", emailOptIn: false });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);

    const pref = db.prepare(`
      SELECT email_opt_in FROM notification_prefs WHERE event_id = ? AND participant_email = ?
    `).get(1, "alex@mail.com");

    expect(pref.email_opt_in).toBe(0);
  });

  test("organizer can send notification; opt-out should not receive; logs created only for opted-in", async () => {
    // Create two users: one opted-in, one opted-out
    await request(app)
      .post("/api/registrations")
      .send({ eventId: 1, name: "Sam", email: "sam@mail.com", emailOptIn: true });

    await request(app)
      .post("/api/registrations")
      .send({ eventId: 1, name: "Alex", email: "alex@mail.com", emailOptIn: false });

    const sendRes = await request(app)
      .post("/api/notifications/send")
      .send({ eventId: 1, subject: "Update", message: "Please arrive 10 mins early." });

    expect(sendRes.statusCode).toBe(200);
    expect(sendRes.body.ok).toBe(true);

    // Logs should exist for opted-in (sam) but not for opted-out (alex)
    const samLogs = db.prepare(`
      SELECT COUNT(*) AS c FROM notification_logs
      WHERE event_id = 1 AND participant_email = 'sam@mail.com' AND type='ORGANIZER_MESSAGE'
    `).get().c;

    const alexLogs = db.prepare(`
      SELECT COUNT(*) AS c FROM notification_logs
      WHERE event_id = 1 AND participant_email = 'alex@mail.com' AND type='ORGANIZER_MESSAGE'
    `).get().c;

    expect(samLogs).toBeGreaterThan(0);
    expect(alexLogs).toBe(0);
  });

  test("can fetch notification logs for event", async () => {
    const res = await request(app).get("/api/notifications/logs?eventId=1");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
