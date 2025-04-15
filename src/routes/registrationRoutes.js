const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const sendRegistrationEmail = require("../../mailer"); // atau sesuaikan path-nya
const puppeteer = require("puppeteer")


// Konfigurasi penyimpanan file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Simpan file di folder uploads/
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Nama file agar unik
  },
});

const upload = multer({ storage: storage });

const db = require("../db");

// API Endpoint untuk registrasi
router.post(
  "/create",
  upload.fields([
    { name: "akte", maxCount: 1 },
    { name: "familyRegister", maxCount: 1 },
    { name: "tkCertificate", maxCount: 1 },
    { name: "foto", maxCount: 1 },
  ]),
  (req, res) => {
    const {
      idRegistration,
      name,
      gender,
      religion,
      birthPlace,
      birthDate,
      address,
      parentPhone,
      email,
    } = req.body;

    // Validasi file upload
    if (
      !req.files.akte ||
      !req.files.familyRegister ||
      !req.files.tkCertificate ||
      !req.files.foto
    ) {
      return res.status(400).json({ message: "All files must be uploaded." });
    }

    // Validasi input form
    if (
      !idRegistration ||
      !name ||
      !gender ||
      !religion ||
      !birthPlace ||
      !birthDate ||
      !address ||
      !parentPhone ||
      !email
    ) {
      return res.status(400).json({ message: "All data must be provided." });
    }

    if (isNaN(idRegistration)) {
      return res
        .status(400)
        .json({ message: "idRegistration must be a Number." });
    }

    const akte = req.files.akte[0].filename;
    const familyRegister = req.files.familyRegister[0].filename;
    const tkCertificate = req.files.tkCertificate[0].filename;
    const foto = req.files.foto[0].filename;

    const query = `INSERT INTO registration (
      idRegistration, name, gender, religion, birthPlace, birthDate, address, 
      parentPhone, email, akte, familyRegister, tkCertificate, foto
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

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
        email,
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
        // Kirim email setelah registrasi berhasil
        sendRegistrationEmail(email, idRegistration)
          .then(() => {
            res.status(201).json({
              message: "Registrasi user berhasil dan email telah dikirim.",
              id: idRegistration,
            });
          })
          .catch((emailErr) => {
            res.status(201).json({
              message: "Registrasi berhasil, tetapi gagal mengirim email.",
              error: emailErr,
              id: idRegistration,
            });
          });
      }
    );
  }
);

router.get("/", (req, res) => {
  const query = `SELECT * FROM registration WHERE isDeleted = 0`;

  db.all(query, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Gagal GET users", error: err });
    }
    res.status(200).json(rows);
  });
});

router.put(
  "/edit/:id",
  upload.fields([
    { name: "akte", maxCount: 1 },
    { name: "familyRegister", maxCount: 1 },
    { name: "tkCertificate", maxCount: 1 },
    { name: "foto", maxCount: 1 },
  ]),
  (req, res) => {
    const { id } = req.params;
    const {
      name,
      gender,
      religion,
      birthPlace,
      birthDate,
      address,
      parentPhone,
      email,
    } = req.body;

    if (
      !name ||
      !gender ||
      !religion ||
      !birthPlace ||
      !birthDate ||
      !address ||
      !parentPhone ||
      !email
    ) {
      return res.status(400).json({ message: "All data must be provided." });
    }

    const checkQuery = `SELECT * FROM registration WHERE id = ?`;

    db.get(checkQuery, [id], (err, row) => {
      if (err) {
        return res.status(500).json({ message: "Database error", error: err });
      }

      if (!row) {
        return res.status(404).json({ message: "Data not found" });
      }

      // Ambil nama file baru jika ada file baru yang di-upload, jika tidak pakai file lama
      const akte = req.files.akte?.[0]?.filename || row.akte;
      const familyRegister =
        req.files.familyRegister?.[0]?.filename || row.familyRegister;
      const tkCertificate =
        req.files.tkCertificate?.[0]?.filename || row.tkCertificate;
      const foto = req.files.foto?.[0]?.filename || row.foto;

      const isTextSame =
        row.name === name &&
        row.gender === gender &&
        row.religion === religion &&
        row.birthPlace === birthPlace &&
        row.birthDate === birthDate &&
        row.address === address &&
        row.parentPhone === parentPhone &&
        row.email === email;

      const isFileSame =
        row.akte === akte &&
        row.familyRegister === familyRegister &&
        row.tkCertificate === tkCertificate &&
        row.foto === foto;

      if (isTextSame && isFileSame) {
        return res.status(400).json({ message: "No changes detected" });
      }

      // Hapus file lama jika ada file baru
      const uploadDir = path.join(__dirname, "..", "uploads");

      const deleteOldFile = (oldFileName) => {
        if (!oldFileName) return;
        const filePath = path.join(uploadDir, oldFileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      };

      if (req.files.akte) deleteOldFile(row.akte);
      if (req.files.familyRegister) deleteOldFile(row.familyRegister);
      if (req.files.tkCertificate) deleteOldFile(row.tkCertificate);
      if (req.files.foto) deleteOldFile(row.foto);

      const updateQuery = `
        UPDATE registration 
        SET name = ?, gender = ?, religion = ?, birthPlace = ?, birthDate = ?, address = ?, parentPhone = ?, email = ?, akte = ?, familyRegister = ?, tkCertificate = ?, foto = ?
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
          email,
          akte,
          familyRegister,
          tkCertificate,
          foto,
          id,
        ],
        function (err) {
          if (err) {
            return res.status(500).json({
              message: "Failed to update registration data",
              error: err,
            });
          }

          res
            .status(200)
            .json({ message: `Update successful for id ${id}` });
        }
      );
    });
  }
);


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
  const query = `SELECT idRegistration, dibuat_tanggal, dibuat_jam, status, name, address, gender, religion, birthPlace, birthDate, parentPhone, foto FROM registration WHERE idRegistration = ?`;

  db.get(query, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: "Gagal GET users", error: err });
    }

    if (!row) {
      return res.status(404).json({ message: "Data tidak ditemukan" });
    }

    // Tambahkan path 'uploads/' jika ada foto
    if (row.foto) {
      row.foto = `uploads/${row.foto}`;
    }

    res.status(200).json(row);
  });
});


router.get("/edit/:id", (req, res) => {
  const { id } = req.params;
  const query = `SELECT * FROM registration WHERE id = ?`;

  db.get(query, [id], (err, rows) => {
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
      res.json({
        message: "Status updated successfully",
        changes: this.changes,
      });
    }
  });
});


router.get("/:id/print", async (req, res) => {
  const { id } = req.params;
  const frontendUrl = `http://localhost:5173/bukti-pendaftaran/${id}`;

  try {
    const browser = await puppeteer.launch({
      headless: "new", // untuk puppeteer versi terbaru
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.goto(frontendUrl, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="bukti-pendaftaran-${id}.pdf"`,
    });

    res.send(pdfBuffer);
  } catch (err) {
    console.error("Gagal generate PDF:", err);
    res.status(500).send("Gagal generate PDF");
  }
});

module.exports = router;


