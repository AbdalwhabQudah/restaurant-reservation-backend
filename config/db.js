const { Pool } = require("pg");
require("dotenv").config();

let pool;

if (process.env.DATABASE_URL) {
  // Production / cloud database
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
} else {
  // Local PostgreSQL
  pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
}

pool.on("connect", () => {
  console.log("PostgreSQL connected");
});

pool.on("error", (error) => {
  console.error(
    "Unexpected PostgreSQL error:",
    error
  );
});

module.exports = pool;