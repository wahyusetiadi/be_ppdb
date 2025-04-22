const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const sendRegistrationEmail = require("../../mailer"); // atau sesuaikan path-nya
const puppeteer = require("puppeteer");
// const PDFDocument = require('pdfkit');
const ejs = require("ejs");
const getDataById = require("../services/getDataById");

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

          res.status(200).json({ message: `Update successful for id ${id}` });
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

  try {
    const data = await getDataById(id);

    if (!data) {
      console.log("Data tidak ditemukan untuk ID:", id);
      return res.status(404).send("Data tidak ditemukan");
    }

    // Proses foto jika ada
    let fotoBase64 = "";
    if (data.foto) {
      const fotoPath = path.join(__dirname, `../../uploads/${data.foto}`);
      console.log("Full foto path:", fotoPath);
      if (fs.existsSync(fotoPath)) {
        const fotoBuffer = fs.readFileSync(fotoPath);
        console.log("Foto buffer size:", fotoBuffer.length);
        fotoBase64 = `data:image/jpeg;base64,${fotoBuffer.toString("base64")}`;
        console.log("Foto Base64 (preview):", fotoBase64.slice(0, 100));
      } else {
        console.log("File foto tidak ditemukan:", fotoPath);
      }
    }
    // Logo Sekolah
    const logoSekolahPath = path.join(__dirname, "../../assets/LogoSekolah.svg");
    const logoEduNEXPath = path.join(__dirname, "../../assets/Logo.svg");

    const logoSekolahBase64 = fs.existsSync(logoSekolahPath)
      ? `data:image/svg+xml;base64,${fs
          .readFileSync(logoSekolahPath)
          .toString("base64")}`
      : "";

    const logoEduNEXBase64 = fs.existsSync(logoEduNEXPath)
      ? `data:image/svg+xml;base64,${fs
          .readFileSync(logoEduNEXPath)
          .toString("base64")}`
      : "";

      console.log("Foto:", fotoBase64.slice(0, 100)); // preview base64
        console.log("Logo Sekolah:", logoSekolahBase64.slice(0, 100));
        console.log("Logo EduNEX:", logoEduNEXBase64.slice(0, 100));

    // Render template EJS ke HTML string
    const html = await ejs.renderFile(
      path.join(__dirname, "../views/bukti-pendaftaran.ejs"),
      { data, fotoBase64, logoSekolahBase64, logoEduNEXBase64 }
    );

    // Launch browser dengan mode headless
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    // Set content HTML
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Optimize PDF size
    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: {
        top: "1cm",
        right: "1cm",
        bottom: "1cm",
        left: "1cm",
      },
      compress: true, // Menggunakan kompresi
      preferCSSPageSize: true,
      printBackground: true, // Matikan background jika tidak perlu
    });

    await browser.close();

    // Set header dan kirim PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="bukti-pendaftaran.pdf"'
    );
    res.setHeader("Content-Length", pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (error) {
    console.error("Error spesifik:", error.message);
    console.error("Stack trace:", error.stack);
    res.status(500).send("Terjadi kesalahan saat membuat PDF.");
  }
});

module.exports = router;
