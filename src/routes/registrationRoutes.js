const express = require("express");
const db = require("../db");
const router = express.Router();

router.post("/create", (req, res) => {
  const {
    idRegistration,
    name,
    gender,
    religion,
    birthPlace,
    birthDate,
    address,
    parentPhone,
    akte,
    familyRegister,
    tkCertificate,
    foto,
  } = req.body;

  if (
    !idRegistration ||
    !name ||
    !gender ||
    !religion ||
    !birthPlace ||
    !birthDate ||
    !address ||
    !parentPhone ||
    !akte ||
    !familyRegister ||
    !tkCertificate ||
    !foto
  ) {
    return res.status(400).json({ message: "All data must be provided." });
  }

  if (isNaN(idRegistration)) {
    return res
      .status(400)
      .json({ message: `/idRegistration/ must be Number.` });
  }

  const query = `INSERT INTO registration (
    idRegistration,
    name, 
    gender,
    religion,
    birthPlace,
    birthDate,
    address,
    parentPhone,
    akte,
    familyRegister,
    tkCertificate,
    foto
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.run(
    query,
    [
      idRegistration,
      name,
      gender,
      religion,
      birthPlace,
      birthDate,
      address,
      parentPhone,
      akte,
      familyRegister,
      tkCertificate,
      foto,
    ],
    function (err) {
      if (err) {
        return res
          .status(500)
          .json({ message: "Registration Failed", error: err });
      }
      res
        .status(201)
        .json({ message: "Registrasi user berhasil", id: this.lastID });
    }
  );
});

router.get("/", (req, res) => {
  const query = `SELECT * FROM registration WHERE isDeleted = 0`;

  db.all(query, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Gagal GET users", error: err });
    }
    res.status(200).json(rows);
  });
});

router.put("/edit/:id", (req, res) => {
  const { id } = req.params;
  const {
    name,
    gender,
    religion,
    birthPlace,
    birthDate,
    address,
    parentPhone,
    akte,
    familyRegister,
    tkCertificate,
    foto,
  } = req.body;

  // Validasi input
  if (
    !name ||
    !gender ||
    !religion ||
    !birthPlace ||
    !birthDate ||
    !address ||
    !parentPhone ||
    !akte ||
    !familyRegister ||
    !tkCertificate ||
    !foto
  ) {
    return res.status(400).json({ message: "All data must be provided." });
  }

  // Query untuk mengecek apakah data ada di database
  const checkQuery = `SELECT * FROM registration WHERE id = ?`;

  db.get(checkQuery, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }

    // Jika data tidak ditemukan, kirimkan status 404
    if (!row) {
      return res.status(404).json({ message: "Data not found" });
    }

    // Membandingkan data yang dikirim dengan data yang ada di database
    if (
      row.name === name &&
      row.gender === gender &&
      row.religion === religion &&
      row.birthPlace === birthPlace &&
      row.birthDate === birthDate &&
      row.address === address &&
      row.parentPhone === parentPhone &&
      row.akte === akte &&
      row.familyRegister === familyRegister &&
      row.tkCertificate === tkCertificate &&
      row.foto === foto
    ) {
      return res.status(400).json({ message: "No changes detected" });
    }

    // Jika data berbeda, lakukan update
    const updateQuery = `
      UPDATE registration 
      SET name = ?, gender = ?, religion = ?, birthPlace = ?, birthDate = ?, address = ?, parentPhone = ?, akte = ?, familyRegister = ?, tkCertificate = ?, foto = ?
      WHERE id = ?`;

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
        akte,
        familyRegister,
        tkCertificate,
        foto,
        id,
      ],
      function (err) {
        if (err) {
          return res
            .status(500)
            .json({ message: "Failed Update Data Registration", error: err });
        }

        // Jika tidak ada perubahan, beri status 400
        if (this.changes === 0) {
          return res.status(400).json({ message: "No changes detected" });
        }

        res.status(200).json({ message: `Update Success with id ${id}` });
      }
    );
  });
});

router.delete("/delete/:id", (req, res) => {
  const { id } = req.params;

  const query = `UPDATE registration SET isDeleted = 1 WHERE id = ?`;

  db.run(query, [id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ message: "Failed to delete data", error: err });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: "Data not found" });
    }

    res
      .status(200)
      .json({ message: `Data with id ${id} has been soft delete` });
  });
});

router.put("/restore/:id", (req, res) => {
  const { id } = req.params;

  const query = `UPDATE registration SET isDeleted = 0 WHERE id = ?`;
  db.run(query, [id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ message: "Failed to restore data", error: err });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: "Data not found or not deleted" });
    }

    res.status(200).json({ message: `Data with id ${id} has been restored` });
  });
});

router.get("/get-all", (req, res) => {
  const query = `SELECT * FROM registration`;

  db.all(query, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Gagal GET users", error: err });
    }
    res.status(200).json(rows);
  });
});

router.get("/:id", (req, res) => {
  const { id } = req.params;
  const query = `SELECT idRegistration, dibuat_tanggal, dibuat_jam, status, name FROM registration WHERE idRegistration = ?`;

  db.get(query,[id], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Gagal GET users", error: err });
    }
    res.status(200).json(rows);
  });
});

router.get("/edit/:id", (req, res) => {
  const { id } = req.params;
  const query = `SELECT * FROM registration WHERE id = ?`;
  
  db.get(query,[id], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Gagal GET users", error: err });
    }
    res.status(200).json(rows);
  });
});

// Endpoint untuk memperbarui status berdasarkan ID
router.put("/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }
  
  const query = `UPDATE registration SET status = ? WHERE id = ?`;
  
  db.run(query, [status, id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: "Status updated successfully", changes: this.changes });
    }
  });
});
module.exports = router;