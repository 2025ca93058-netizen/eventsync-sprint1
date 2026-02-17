// src/server.js
import express from "express";
// optional: import morgan from "morgan"; import cors from "cors";
import { eventsRouter } from "./routes/events.js";
import { registrationsRouter } from "./routes/registrations.js";
import { notificationsRouter } from "./routes/notifications.js";
import { feedbackRouter } from "./routes/feedback.js";
import { analyticsRouter } from "./routes/analytics.js";
import "./scheduler.js"; // starts cron job

const app = express();
app.use(express.json());

// optional
// app.use(cors());
// app.use(morgan("dev"));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/events", eventsRouter);
app.use("/api/registrations", registrationsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/analytics", analyticsRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`EventSync API running on http://localhost:${port}`));
