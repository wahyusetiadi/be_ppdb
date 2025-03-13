const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const db = new sqlite3.Database("./data/database.db");
const SECRET_KEY = "mysecretkey"

//create
router.post("/", (req, res) => {
  const {
    name,
    gender,
    religion,
    birthPlace,
    birthDate,
    address,
    parentPhone,
    documents,
  } = req.body;
  db.run(
    `INSERT INTO registration (name, gender, religion, birthPlace, birthDate, address, parentPhone, documents) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      gender,
      religion,
      birthPlace,
      birthDate,
      address,
      parentPhone,
      documents,
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res
        .status(201)
        .json({
          id: this.lastID,
          name,
          gender,
          religion,
          birthPlace,
          birthDate,
          address,
          parentPhone,
          documents,
        });
    }
  );
});

//read
router.get("/", (req, res) => {
  db.all(`SELECT * FROM registration`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ user: rows });
  });
});

//update
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const {
    name,
    gender,
    religion,
    birthPlace,
    birthDate,
    address,
    parentPhone,
    documents,
  } = req.body;

  // if(!name || !gender || !religion || !birthPlace || !birthDate || !address || !parentPhone || !documents ) {
  //   return res.status(400).json({ message: 'Semua field wajib diisi(name, gender, religion, birthPlace, birthDate, address, parentPhone, documents).'});
  // }

  // const checkQuery = 'SELECT * FROM students WHERE name = ? AND id != ?';
  // db.get(checkQuery, [name, id], (err, row) => {
  //   if (err) {
  //     return res.status(500).json({ message: "Terjadi kesalahan pada server." });
  //   }
  //   if(row) {
  //     return res.status(400).json({ message: 'Email sudah digunakan oleh user lain.' });
  //   }

  const updateQuery = `
    UPDATE registration
    SET name = ?, gender = ?, religion = ?, birthPlace = ?, birthDate = ?, address = ?, parentPhone = ?, documents = ?
    WHERE id = ?
    `;

  db.run(
    updateQuery,
    [
      name,
      gender,
      religion,
      birthPlace,
      birthDate,
      address,
      parentPhone,
      documents,
      id,
    ],
    function (err) {
      if (err) {
        return res
          .status(500)
          .json({ message: "Gagal memperbarui student", error: err });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: "student tidak ditemukan" });
      }

      res
        .status(200)
        .json({ message: `Registrasi dengan ID ${id} berhasil diperbarui.` });
    }
  );
  // })
});

//delete
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const query = `DELETE FROM students WHERE id + ?`;

  db.run(query, [id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ message: `Gagal menghapus user`, error: err });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "User tidak ditemukan " });
    }
    res.status(200).json({ message: `Berhasil menghapus user id: ${id}` });
  });
});

// API untuk register user (bisa dihapus kalau hanya butuh login)
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username dan password wajib diisi" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("Mencoba insert user:", username); // Debugging log

    db.run(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, hashedPassword],
      function (err) {
        if (err) {
          console.error("Error saat insert user:", err.message);
          return res
            .status(500)
            .json({ message: "Gagal menambahkan user", error: err.message });
        }
        res.json({ message: "User berhasil didaftarkan", id: this.lastID });
      }
    );
  } catch (error) {
    console.error("Error hashing password:", error);
    res.status(500).json({ message: "Error internal", error: error.message });
  }
});

//API untuk login user
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, user) => {
      if (err || !user) {
        return res
          .status(401)
          .json({ message: "Username atau Password salah! " });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res
          .status(401)
          .json({ message: "Username atau Password salah!" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username },
        SECRET_KEY,
        { expiresIn: "1h" }
      );
      res.json({ token });
    }
  );
});

// API untuk mendapatkan data pengguna berdasarkan token
router.get("/me", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "token tidak ditemukan" });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ message: "token tidak valid" });

    db.get("SELECT id, username FROM users WHERE id = ? ", [decoded.id], (err, user) => {
      if (err || !user) return res.status(404).json({ message: "User tidak ditemukan" });
      
      res.json(user);
    });
  });
});

module.exports = router;
