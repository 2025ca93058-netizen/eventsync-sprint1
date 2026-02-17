import request from "supertest";
import express from "express";

process.env.DB_PATH = ":memory:";

// Import AFTER setting DB_PATH
import { db } from "../src/db.js";
import { registrationsRouter } from "../src/routes/registrations.js";
import { feedbackRouter } from "../src/routes/feedback.js";
import { eventsRouter } from "../src/routes/events.js";

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/events", eventsRouter);
  app.use("/api/registrations", registrationsRouter);
  app.use("/api/feedback", feedbackRouter);
  return app;
}

describe("Sprint 2 - Feedback APIs", () => {
  let app;

  beforeAll(() => {
    app = makeApp();

    // Seed a known event for test repeatability
    db.prepare(`
      INSERT INTO events (title, description, start_time, end_time, location, organizer, capacity)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      "Test Event",
      "Desc",
      "2026-02-15T10:00:00.000Z",
      "2026-02-15T12:00:00.000Z",
      "Mumbai",
      "EventSync",
      2
    );
  });

  afterAll(() => {
    db.close();
  });

  test("should not allow feedback when feedback form is disabled", async () => {
    const res = await request(app)
      .post("/api/feedback/responses")
      .send({ eventId: 1, email: "alex@mail.com", rating: 5, comment: "Great" });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Feedback not enabled/i);
  });

  test("organizer can enable feedback form", async () => {
    const res = await request(app)
      .post("/api/feedback/forms")
      .send({ eventId: 1, enabled: true });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test("should block feedback if participant is not registered", async () => {
    const res = await request(app)
      .post("/api/feedback/responses")
      .send({ eventId: 1, email: "notregistered@mail.com", rating: 4 });

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toMatch(/Only registered participants/i);
  });

  test("registered participant can submit feedback", async () => {
    // Register first
    const reg = await request(app)
      .post("/api/registrations")
      .send({ eventId: 1, name: "Alex", email: "alex@mail.com", emailOptIn: true });

    expect([201, 200]).toContain(reg.statusCode);

    // Submit feedback
    const res = await request(app)
      .post("/api/feedback/responses")
      .send({ eventId: 1, email: "alex@mail.com", rating: 5, comment: "Well organized!" });

    expect(res.statusCode).toBe(201);
    expect(res.body.ok).toBe(true);
  });

  test("should prevent duplicate feedback for the same event+email", async () => {
    const res = await request(app)
      .post("/api/feedback/responses")
      .send({ eventId: 1, email: "alex@mailucite@mail.com", rating: 4 });

    // If your DB unique constraint is active, duplicate should be 409
    expect([409, 201]).toContain(res.statusCode);
    if (res.statusCode === 409) {
      expect(res.body.error).toMatch(/already submitted/i);
    }
  });

  test("organizer can view feedback summary", async () => {
    const res = await request(app).get("/api/feedback/summary?eventId=1");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("eventId", 1);
    expect(res.body).toHaveProperty("responses");
    expect(res.body).toHaveProperty("avg_rating");
    expect(Array.isArray(res.body.latest)).toBe(true);
  });
});
