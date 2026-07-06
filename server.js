const express = require("express");
const mysql = require("mysql2");
const crypto = require("crypto");

const app = express();

app.use(express.json());

/*
====================================
MYSQL CONNECTION
====================================
*/

const db = mysql.createPool(
  process.env.MYSQL_PUBLIC_URL
);

/*
====================================
HOME ROUTE
====================================
*/

app.get("/", (req, res) => {

  res.send("Xport USB License Server Running");

});

/*
====================================
GENERATE LICENSE
====================================
*/

app.post("/generate-license", (req, res) => {

  const licenseKey =
    crypto.randomBytes(16).toString("hex");

  console.log("Generated License:", licenseKey);

  const sql =
    "INSERT INTO licenses (license_key, status) VALUES (?, ?)";

  db.query(
    sql,
    [licenseKey, "active"],
    (err, result) => {

      if (err) {

        console.log("========== MYSQL ERROR ==========");
        console.log(err);
        console.log("=================================");

        return res.json({
          success: false,
          error: err.message,
          full_error: err
        });

      }

      return res.json({
        success: true,
        license: licenseKey
      });

    }
  );

});

/*
====================================
VERIFY LICENSE
====================================
*/

app.post("/verify-license", (req, res) => {

  const { license_key, hwid } = req.body;

  if (!license_key || !hwid) {

    return res.json({
      success: false,
      message: "Missing license_key or hwid"
    });

  }

  const sql =
    "SELECT * FROM licenses WHERE license_key=?";

  db.query(sql, [license_key], (err, results) => {

    if (err) {

      console.log("VERIFY LICENSE ERROR:");
      console.log(err);

      return res.json({
        success: false,
        error: err.message
      });

    }

    if (results.length === 0) {

      return res.json({
        success: false,
        message: "Invalid License"
      });

    }

    const license = results[0];

    /*
    ==========================
    LICENSE STATUS CHECK
    ==========================
    */

    if (license.status !== "active") {

      return res.json({
        success: false,
        message: "License Disabled"
      });

    }

    /*
    ==========================
    FIRST HWID BIND
    ==========================
    */

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

    /*
    ==========================
    HWID CHECK
    ==========================
    */

    if (license.hwid !== hwid) {

      return res.json({
        success: false,
        message: "License Already Used"
      });

    }

    /*
    ==========================
    LICENSE VALID
    ==========================
    */

    return res.json({
      success: true,
      message: "License Valid"
    });

  });

});

/*
====================================
SERVER START
====================================
*/

const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {

  console.log(`Server running on port ${PORT}`);

});
