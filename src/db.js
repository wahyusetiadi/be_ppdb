const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require('fs');

// Ensure the 'data' folder exists
const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Buat koneksi ke database SQLite
const db = new sqlite3.Database(
  path.join(__dirname, "..", "data", "database.db"),
  (err) => {
    if (err) {
      console.error("Error opening database:", err.message);
    } else {
      console.log("Connected to SQLite database.");
    }
  }
);

// Membuat tabel jika belum ada
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS registration (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idRegistration INTEGER,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      gender TEXT NOT NULL,
      religion TEXT NOT NULL,
      birthPlace TEXT NOT NULL,
      birthDate TEXT NOT NULL,
      address TEXT NOT NULL,
      parentPhone TEXT NOT NULL,
      akte TEXT CHECK(akte LIKE '%.pdf' OR akte LIKE '%.png'),
      familyRegister TEXT CHECK(familyRegister LIKE '%.pdf' OR familyRegister LIKE '%.png'),
      tkCertificate TEXT CHECK(tkCertificate LIKE '%.pdf' OR tkCertificate LIKE '%.png'),
      foto TEXT,
      isDeleted INTEGER DEFAULT 0, 
      dibuat_tanggal DATE DEFAULT (DATE('now', '+7 hours')),
      dibuat_jam TIME DEFAULT (TIME('now' , '+7 hours')),
      status TEXT DEFAULT menunggu
    )
  `, (err) => {
    if (err) {
      console.error("Error creating table:", err.message);
    } else {
      console.log("Table created or already exists.");
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`, (err) => {
if (err) {
console.error("Gagal membuat tabel users:", err.message);
} else {
console.log("Tabel users siap digunakan.");
}
});
});

module.exports = db;
