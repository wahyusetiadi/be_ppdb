const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./db/database.db");

//create
router.post("/", (req, res) => {
  const { name, gender, religion, birthPlace, birthDate, address, parentPhone, documents } = req.body;
  db.run(
    `INSERT INTO registration (name, gender, religion, birthPlace, birthDate, address, parentPhone, documents) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, gender, religion, birthPlace, birthDate, address, parentPhone, documents],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID, name, gender, religion, birthPlace, birthDate, address, parentPhone, documents });
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
  const { name, gender, religion, birthPlace, birthDate, address, parentPhone, documents } = req.body;

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

    db.run(updateQuery, [name, gender, religion, birthPlace, birthDate, address, parentPhone, documents, id], function (err) {
      if (err) {
        return res.status(500).json({ message: "Gagal memperbarui student", error: err });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: "student tidak ditemukan" });
      }

      res.status(200).json({ message: `Registrasi dengan ID ${id} berhasil diperbarui.` });
    });
  // })
});

//delete
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const query = `DELETE FROM students WHERE id + ?`;

  db.run(query, [id], function(err) {
    if(err) {
      return res.status(500).json({ message: `Gagal menghapus user`, error: err });
    }
    if(this.changes === 0 ) {
      return res.status(404).json({ message: "User tidak ditemukan "});
    }
    res.status(200).json({ message: `Berhasil menghapus user id: ${id}`});
  });
});

module.exports = router;
