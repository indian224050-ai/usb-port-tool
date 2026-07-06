const express = require("express");
const mysql = require("mysql2");
const crypto = require("crypto");

const app = express();
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: "usbtool",
  port: process.env.MYSQLPORT
});

db.connect((err) => {
  if (err) {
    console.log("Database Error:", err);
  } else {
    console.log("MySQL Connected");
  }
});

app.get("/", (req, res) => {
  res.send("Xport USB License Server Running");
});

app.post("/generate-license", (req, res) => {
  const key = crypto.randomBytes(16).toString("hex");

  const sql = `
    INSERT INTO licenses
    (license_key, status)
    VALUES (?, ?)
  `;

  db.query(sql, [key, "active"], (err) => {
    if (err) {
      return res.json({
        success: false,
        error: err
      });
    }

    res.json({
      success: true,
      license: key
    });
  });
});

app.post("/verify-license", (req, res) => {
  const { license_key, hwid } = req.body;

  const sql = `
    SELECT * FROM licenses
    WHERE license_key=?
  `;

  db.query(sql, [license_key], (err, result) => {
    if (err) {
      return res.json({
        success: false
      });
    }

    if (result.length === 0) {
      return res.json({
        success: false,
        message: "Invalid License"
      });
    }

    const license = result[0];

    if (!license.hwid) {
      db.query(
        "UPDATE licenses SET hwid=? WHERE license_key=?",
        [hwid, license_key]
      );

      return res.json({
        success: true,
        message: "Activated First Time"
      });
    }

    if (license.hwid !== hwid) {
      return res.json({
        success: false,
        message: "License Already Used"
      });
    }

    res.json({
      success: true,
      message: "License Valid"
    });
  });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
