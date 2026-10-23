const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();
const authRoutes = require(
  "./routes/authRoutes"
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Restaurant Reservation API is running",
  });
});

app.get("/api/test-db", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT NOW() AS current_time");

    res.status(200).json({
      message: "Database connection successful",
      databaseTime: result.rows[0].current_time,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/health", async (req, res, next) => {
  try {
    const db = await pool.query("SELECT 1 AS ok");

    res.status(200).json({
      status: "ok",
      api: true,
      database: db.rows[0].ok === 1,
    });
  } catch (error) {
    next(error);
  }
});

app.use(
  "/api/auth",
  authRoutes
);

app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 5000);

async function startServer() {
  try {
    await pool.query("SELECT 1");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Could not connect to PostgreSQL:", error.message);
    process.exit(1);
  }
}

startServer();
