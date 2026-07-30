// server.js
require("dotenv").config();
const express = require("express");
const path = require("path");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 3000;

// Create MySQL connection pool using environment variables
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Optional: check DB connection on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ Connected to MySQL as:", conn.config.user);
    conn.release();
  } catch (err) {
    console.error("❌ MySQL connection error at startup:", err.message);
  }
})();

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// GET /api/employees
app.get("/api/employees", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, full_name, email, role, department, location, join_date, photo_url FROM employees ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching employees", err);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

// POST /api/employees
app.post("/api/employees", async (req, res) => {
  try {
    const { full_name, email, role, department, location, join_date } = req.body;

    if (!full_name || !email) {
      return res.status(400).json({ error: "full_name and email are required" });
    }

    const [result] = await pool.query(
      `INSERT INTO employees (full_name, email, role, department, location, join_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [full_name, email, role || "", department || "", location || "", join_date || null]
    );

    const [rows] = await pool.query(
      "SELECT id, full_name, email, role, department, location, join_date, photo_url FROM employees WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error inserting employee", err);
    res.status(500).json({ error: "Failed to create employee" });
  }
});

// Fallback: send index.html for root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
