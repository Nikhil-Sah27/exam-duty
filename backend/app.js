const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const errorHandler = require("./shared/middleware/errorHandler");

const app = express();

// Parse the query string simply ("?a=b"), NOT with the extended `qs` parser
// that turns "?status[$ne]=x" into a nested object. MUST be set before the
// first app.use(): Express locks the query-parser middleware in on the first
// middleware registration, so setting it afterwards is silently ignored.
// Combined with mongoSanitize below and the String()-coercion in the services,
// this closes NoSQL operator injection through query params.
app.set("query parser", "simple");

// Security response headers (CSP is left to the frontend host; this covers
// X-Content-Type-Options, X-Frame-Options, HSTS, Referrer-Policy, etc.).
app.use(helmet());

// CORS — the frontend origin(s). Defaults cover local dev; production origins
// come from CORS_ORIGINS (comma-separated). Ngrok tunnels are accepted only
// outside production, so a live deploy no longer trusts every *.ngrok-free.app.
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:4173",
  "http://localhost:5173",
  ...(process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
    : []),
];
const allowNgrok = process.env.NODE_ENV !== "production";

app.use(cors({
  origin: (origin, callback) => {
    const ok =
      !origin ||
      allowedOrigins.includes(origin) ||
      (allowNgrok && /\.ngrok-free\.app$/.test(origin));
    callback(ok ? null : new Error("Not allowed by CORS"), ok);
  },
  credentials: true,
}));

// Body parsers with an explicit size cap (bounds request-body DoS).
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Strip any keys containing "$" or "." from body/query/params, so no request
// can smuggle a Mongo operator into a query object.
app.use(mongoSanitize());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Module routes
app.use("/api/auth", require("./modules/auth/auth.routes"));
app.use("/api/users", require("./modules/user/user.routes"));
app.use("/api/exams", require("./modules/exam/exam.routes"));
app.use("/api/exam-groups", require("./modules/exam/examGroup.routes"));
app.use("/api/create-exams", require("./modules/create-exams/createExams.routes"));
app.use("/api/duties", require("./modules/duty/duty.routes"));
app.use("/api/change-requests", require("./modules/change-request/changeRequest.routes"));
app.use("/api/notifications", require("./modules/notification/notification.routes"));
app.use("/api/departments", require("./modules/department/department.routes"));
app.use("/api/infrastructure", require("./modules/infrastructure/infrastructure.routes"));
app.use("/api/reports", require("./modules/report/report.routes"));
app.use("/api/audit", require("./modules/audit/audit.routes"));
app.use("/api/dcs", require("./modules/dcs/dcsGroup.routes"));
app.use("/api/seat-sharing", require("./modules/seat-sharing/seatSharing.routes"));
app.use("/api/duty-calculation", require("./modules/duty-calculation/dutyCalculation.routes"));
app.use("/api/reminders", require("./modules/reminder/reminder.routes"));
app.use("/api/whatsapp", require("./modules/whatsapp/whatsapp.routes"));
app.use("/api/push", require("./modules/push/push.routes"));

// Global error handler (must be after all routes)
app.use(errorHandler);

module.exports = app;
