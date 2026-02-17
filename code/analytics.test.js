import request from "supertest";
import express from "express";

process.env.DB_PATH = ":memory:";

import { db } from "../src/db.js";
import { registrationsRouter } from "../src/routes/registrations.js";
import { notificationsRouter } from "../src/routes/notifications.js";
import { feedbackRouter } from "../src/routes/feedback.js";
import { analyticsRouter } from "../src/routes/analytics.js";
import { eventsRouter } from "../src/routes/events.js";

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/events", eventsRouter);
  app.use("/api/registrations", registrationsRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/feedback", feedbackRouter);
  app.use("/api/analytics", analyticsRouter);
  return app;
}

describe("Sprint 2 - Analytics APIs", () => {
  let app;

  beforeAll(async () => {
    app = makeApp();

    // Seed two events
    const ins = db.prepare(`
      INSERT INTO events (title, description, start_time, end_time, location, organizer, capacity)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    ins.run("Event A", "Desc", "2026-02-15T10:00:00.000Z", "2026-02-15T12:00:00.000Z", "Mumbai", "EventSync", 10);
    ins.run("Event B", "Desc", "2026-03-01T10:00:00.000Z", "2026-03-01T12:00:00.000Z", "Pune", "EventSync", 10);

    // Register users
    await request(app).post("/api/registrations").send({ eventId: 1, name: "Alex", email: "alex@mail.com", emailOptIn: true });
    await request(app).post("/api/registrations").send({ eventId: 1, name: "Sam", email: "sam@mail.com", emailOptIn: true });
    await request(app).post("/api/registrations").send({ eventId: 2, name: "Lee", email: "lee@mail.com", emailOptIn: true });

    // Enable feedback + submit for Event A
    await request(app).post("/api/feedback/forms").send({ eventId: 1, enabled: true });
    await request(app).post("/api/feedback/responses").send({ eventId: 1, email: "alex@mail.com", rating: 5, comment: "Great!" });

    // Send organizer notifications for Event A (should log)
    await request(app).post("/api/notifications/send").send({ eventId: 1, subject: "Update", message: "Agenda updated." });
  });

  afterAll(() => db.close());

  test("analytics overview returns events with aggregated metrics", async () => {
    const res = await request(app).get("/api/analytics/overview");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("events");
    expect(Array.isArray(res.body.events)).toBe(true);

    const eventA = res.body.events.find((e) => e.title === "Event A");
    const eventB = res.body.events.find((e) => e.title === "Event B");

    expect(eventA).toBeTruthy();
    expect(eventB).toBeTruthy();

    // Registration counts
    expect(eventA.registrations).toBe(2);
    expect(eventB.registrations).toBe(1);

    // Feedback stats
    expect(eventA.feedback.responses).toBeGreaterThanOrEqual(1);
    expect(eventA.feedback.avg_rating).toBeTruthy();

    // Notifications stats (sent/failed)
    expect(eventA.notifications.sent + eventA.notifications.failed).toBeGreaterThanOrEqual(1);
  });

  test("analytics can filter by date range (from/to)", async () => {
    const from = encodeURIComponent("2026-02-01T00:00:00.000Z");
    const to = encodeURIComponent("2026-02-28T23:59:59.999Z");

    const res = await request(app).get(`/api/analytics/overview?from=${from}&to=${to}`);
    expect(res.statusCode).toBe(200);

    // Should include Event A (Feb) but exclude Event B (Mar)
    const titles = res.body.events.map((e) => e.title);
    expect(titles).toContain("Event A");
    expect(titles).not.toContain("Event B");
  });
});
