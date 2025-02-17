const express = require("express");
const db = require("../db");
const router = express.Router();

router.post("/", (req, res) => {
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
    return res
      .status(400)
      .json({ message: "All data must be provided." });
  }

  if(isNaN(idRegistration)) {
    return res
    .status(400)
    .json({ message: `/idRegistration/ must be Number.`})
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
  const query = `SELECT * FROM registration`;

  db.all(query, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Gagal GET users", error: err });
    }
    res.status(200).json(rows);
  });
});

module.exports = router;
