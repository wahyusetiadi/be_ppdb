const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const sendRegistrationEmail = require("../../mailer");
const puppeteer = require("puppeteer");
const ejs = require("ejs");
const getDataById = require("../services/getDataById");

const db = require("../db");

// Storage multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// --- CREATE ---
router.post(
  "/create",
  upload.fields([
    { name: "akte", maxCount: 1 },
    { name: "familyRegister", maxCount: 1 },
    { name: "tkCertificate", maxCount: 1 },
    { name: "foto", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
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

      if (
        !req.files.akte ||
        !req.files.familyRegister ||
        !req.files.tkCertificate ||
        !req.files.foto
      ) {
        return res.status(400).json({ message: "All files must be uploaded." });
      }

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
        return res.status(400).json({ message: "idRegistration must be a Number." });
      }

      const akte = req.files.akte[0].filename;
      const familyRegister = req.files.familyRegister[0].filename;
      const tkCertificate = req.files.tkCertificate[0].filename;
      const foto = req.files.foto[0].filename;

      const query = `INSERT INTO registration (
        idRegistration, name, gender, religion, birthPlace, birthDate, address, 
        parentPhone, email, akte, familyRegister, tkCertificate, foto
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      await db.execute(query, [
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
      ]);

      try {
        await sendRegistrationEmail(email, idRegistration);
        res.status(201).json({ message: "Registrasi user berhasil dan email telah dikirim.", id: idRegistration });
      } catch (emailErr) {
        res.status(201).json({ message: "Registrasi berhasil, tetapi gagal mengirim email.", error: emailErr.message, id: idRegistration });
      }
    } catch (err) {
      res.status(500).json({ message: "Registration Failed", error: err.message });
    }
  }
);

// --- GET ALL ---
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM registration WHERE isDeleted = 0`);
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ message: "Gagal GET users", error: err.message });
  }
});

// --- GET DETAIL /:id ---
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const query = `SELECT idRegistration, dibuat_tanggal, dibuat_jam, status, name, address, gender, religion, birthPlace, birthDate, parentPhone, foto FROM registration WHERE idRegistration = ?`;

    const [results] = await db.query(query, [id]);
    
    if (results.length === 0) {
      return res.status(404).json({ message: "Data tidak ditemukan" });
    }

    const row = results[0];
    if (row.foto) row.foto = `uploads/${row.foto}`;

    res.status(200).json(row);
  } catch (err) {
    res.status(500).json({ message: "Gagal GET users", error: err.message });
  }
});

// --- GET ALL (admin) ---
router.get("/get-all", async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM registration`);
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ message: "Gagal GET users", error: err.message });
  }
});

// --- EDIT ---
router.put("/edit/:id", upload.fields([
  { name: "akte", maxCount: 1 },
  { name: "familyRegister", maxCount: 1 },
  { name: "tkCertificate", maxCount: 1 },
  { name: "foto", maxCount: 1 },
]), async (req, res) => {
  try {
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

    if (!name || !gender || !religion || !birthPlace || !birthDate || !address || !parentPhone || !email) {
      return res.status(400).json({ message: "All data must be provided." });
    }

    const [results] = await db.query(`SELECT * FROM registration WHERE id = ?`, [id]);
    
    if (results.length === 0) {
      return res.status(404).json({ message: "Data not found" });
    }

    const row = results[0];

    const akte = req.files.akte?.[0]?.filename || row.akte;
    const familyRegister = req.files.familyRegister?.[0]?.filename || row.familyRegister;
    const tkCertificate = req.files.tkCertificate?.[0]?.filename || row.tkCertificate;
    const foto = req.files.foto?.[0]?.filename || row.foto;

    const uploadDir = path.join(__dirname, "..", "uploads");
    const deleteOldFile = (filename) => {
      if (!filename) return;
      const filePath = path.join(uploadDir, filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    };

    if (req.files.akte) deleteOldFile(row.akte);
    if (req.files.familyRegister) deleteOldFile(row.familyRegister);
    if (req.files.tkCertificate) deleteOldFile(row.tkCertificate);
    if (req.files.foto) deleteOldFile(row.foto);

    const updateQuery = `
      UPDATE registration 
      SET name = ?, gender = ?, religion = ?, birthPlace = ?, birthDate = ?, address = ?, parentPhone = ?, email = ?, akte = ?, familyRegister = ?, tkCertificate = ?, foto = ?
      WHERE id = ?`;

    await db.execute(updateQuery, [
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
    ]);
    
    res.status(200).json({ message: `Update successful for id ${id}` });
  } catch (err) {
    res.status(500).json({ message: "Failed to update registration data", error: err.message });
  }
});

// --- SOFT DELETE ---
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.execute(`UPDATE registration SET isDeleted = 1 WHERE id = ?`, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Data not found" });
    }
    
    res.status(200).json({ message: `Data with id ${id} has been soft deleted` });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete data", error: err.message });
  }
});

// --- RESTORE ---
router.put("/restore/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.execute(`UPDATE registration SET isDeleted = 0 WHERE id = ?`, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Data not found or not deleted" });
    }
    
    res.status(200).json({ message: `Data with id ${id} has been restored` });
  } catch (err) {
    res.status(500).json({ message: "Failed to restore data", error: err.message });
  }
});

// --- UPDATE STATUS ---
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const [result] = await db.execute(`UPDATE registration SET status = ? WHERE id = ?`, [status, id]);
    res.json({ message: "Status updated successfully", changes: result.affectedRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PRINT PDF ---
router.get("/:id/print", async (req, res) => {
  const { id } = req.params;

  try {
    const data = await getDataById(id);
    if (!data) return res.status(404).send("Data tidak ditemukan");

    // Foto pendaftar
    let fotoBase64 = "";
    const fotoPath = path.join(__dirname, `../../uploads/${data.foto}`);
    if (fs.existsSync(fotoPath)) {
      const fotoBuffer = fs.readFileSync(fotoPath);
      fotoBase64 = `data:image/jpeg;base64,${fotoBuffer.toString("base64")}`;
    }

    // Logo Sekolah
    const logoSekolahBase64 = fs.existsSync(path.join(__dirname, "../../assets/LogoSekolah.svg"))
      ? `data:image/svg+xml;base64,${fs.readFileSync(path.join(__dirname, "../../assets/LogoSekolah.svg")).toString("base64")}`
      : "";

    const logoEduNEXBase64 = fs.existsSync(path.join(__dirname, "../../assets/Logo.svg"))
      ? `data:image/svg+xml;base64,${fs.readFileSync(path.join(__dirname, "../../assets/Logo.svg")).toString("base64")}`
      : "";

    const html = await ejs.renderFile(
      path.join(__dirname, "../views/bukti-pendaftaran.ejs"),
      { data, fotoBase64, logoSekolahBase64, logoEduNEXBase64 }
    );

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: { top: "1cm", right: "1cm", bottom: "1cm", left: "1cm" },
      compress: true,
      printBackground: true,
    });

    await browser.close();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="bukti-pendaftaran.pdf"');
    res.setHeader("Content-Length", pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Terjadi kesalahan saat membuat PDF.");
  }
});

module.exports = router;