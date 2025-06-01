const express = require("express");
const router = express.Router();
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const db = require("../db");
const { sendError } = require("../utils/response");
const SECRET_KEY = process.env.SECRET_KEY;

//read
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM users`);
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ message: "Gagal GET users", error: err.message });
  }
});

//delete
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("get id delete", id);

    const [result] = await db.execute(`DELETE FROM users WHERE id = ?`, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User tidak ditemukan " });
    }
    res.status(200).json({ message: `Berhasil menghapus user id: ${id}` });
  } catch (err) {
    res.status(500).json({ message: `Gagal menghapus user`, error: err });
  }
});

// API untuk register user (bisa dihapus kalau hanya butuh login)
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const query = `INSERT INTO users ( username, password ) VALUES (?, ?)`;

  try {
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username dan password wajib diisi" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute(query, [username, hashedPassword]);
    res.status(201).json({ message: `Success Registration` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//API untuk login user
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    //Check Username into database
    if (rows.length === 0) {
      return sendError(res, "Username tidak terdaftar", 404);
    }

    const user = rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // return res.status(401).json({ message: "Username atau Password salah!" });
      return sendError(res, "Username atau Password salah!", 404);
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    console.error("Login error:", err);
    res
      .status(500)
      .json({ message: "Terjadi kesalahan saat login.", error: err.message });
  }
});

// API untuk mendapatkan data pengguna berdasarkan token
router.get("/me", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "token tidak ditemukan" });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ message: "token tidak valid" });

    db.query(
      "SELECT id, username FROM users WHERE id = ? ",
      [decoded.id],
      (err, user) => {
        if (err || !user)
          return res.status(404).json({ message: "User tidak ditemukan" });

        res.json(user);
      }
    );
  });
});

module.exports = router;
