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
    const query = `SELECT idRegistration, dibuat_tanggal, dibuat_jam, status, name, address, gender, religion, birthPlace, birthDate, parentPhone, foto, email, akte, familyRegister, tkCertificate FROM registration WHERE idRegistration = ?`;

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

router.get("/edit/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const query = `SELECT id, name, address, gender, religion, birthPlace, birthDate, parentPhone, email, foto, akte, familyRegister, tkCertificate FROM registration WHERE id = ?`;

    const [results] = await db.query(query, [id]);

    if (results.length === 0) {
      return res.status(404).json({ message: "Data tidak ditemukan untuk edit" });
    }

    const row = results[0];
    if (row.foto) row.foto = `uploads/${row.foto}`;

    res.status(200).json(row);
  } catch (err) {
    res.status(500).json({ message: "Gagal GET data untuk edit", error: err.message });
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
  console.log("=== EDIT ENDPOINT CALLED ===");
  console.log("ID:", req.params.id);
  console.log("Body:", req.body);
  console.log("Files:", req.files);

  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id) {
      console.log("ERROR: No ID provided");
      return res.status(400).json({ message: "ID is required." });
    }

    console.log("Checking if record exists...");
    // Check if record exists first
    const [results] = await db.query(`SELECT * FROM registration WHERE id = ?`, [id]);
    console.log("Query results:", results);
    
    if (results.length === 0) {
      console.log("ERROR: Record not found");
      return res.status(404).json({ message: "Data not found" });
    }

    const currentData = results[0];
    console.log("Current data:", currentData);

    // Prepare update data
    const updateData = {};
    
    // Helper function to format date for MySQL
    const formatDateForMySQL = (dateString) => {
      if (!dateString) return null;
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return null;
        
        // Format as YYYY-MM-DD for MySQL DATE column
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
      } catch (err) {
        console.error('Date formatting error:', err);
        return null;
      }
    };

    // Only add fields that are provided and not empty
    if (req.body.name && req.body.name.trim() !== '') updateData.name = req.body.name.trim();
    if (req.body.gender && req.body.gender.trim() !== '') updateData.gender = req.body.gender.trim();
    if (req.body.religion && req.body.religion.trim() !== '') updateData.religion = req.body.religion.trim();
    if (req.body.birthPlace && req.body.birthPlace.trim() !== '') updateData.birthPlace = req.body.birthPlace.trim();
    
    // Handle birthDate with proper formatting
    if (req.body.birthDate && req.body.birthDate.trim() !== '') {
      const formattedDate = formatDateForMySQL(req.body.birthDate.trim());
      if (formattedDate) {
        updateData.birthDate = formattedDate;
        console.log(`Original date: ${req.body.birthDate}, Formatted: ${formattedDate}`);
      } else {
        console.log('ERROR: Invalid date format for birthDate');
        return res.status(400).json({ message: "Invalid date format for birthDate. Use YYYY-MM-DD format." });
      }
    }
    
    if (req.body.address && req.body.address.trim() !== '') updateData.address = req.body.address.trim();
    if (req.body.parentPhone && req.body.parentPhone.trim() !== '') updateData.parentPhone = req.body.parentPhone.trim();
    if (req.body.email && req.body.email.trim() !== '') updateData.email = req.body.email.trim();

    console.log("Update data:", updateData);

    // Handle file uploads
    const uploadDir = path.join(__dirname, "..", "uploads");
    
    const safeDeleteFile = (filename) => {
      if (!filename) return;
      try {
        const filePath = path.join(uploadDir, filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted old file: ${filename}`);
        }
      } catch (err) {
        console.error(`Failed to delete file ${filename}:`, err.message);
      }
    };

    // Handle file updates
    if (req.files && req.files.akte && req.files.akte[0]) {
      safeDeleteFile(currentData.akte);
      updateData.akte = req.files.akte[0].filename;
      console.log("New akte file:", updateData.akte);
    }

    if (req.files && req.files.familyRegister && req.files.familyRegister[0]) {
      safeDeleteFile(currentData.familyRegister);
      updateData.familyRegister = req.files.familyRegister[0].filename;
      console.log("New familyRegister file:", updateData.familyRegister);
    }

    if (req.files && req.files.tkCertificate && req.files.tkCertificate[0]) {
      safeDeleteFile(currentData.tkCertificate);
      updateData.tkCertificate = req.files.tkCertificate[0].filename;
      console.log("New tkCertificate file:", updateData.tkCertificate);
    }

    if (req.files && req.files.foto && req.files.foto[0]) {
      safeDeleteFile(currentData.foto);
      updateData.foto = req.files.foto[0].filename;
      console.log("New foto file:", updateData.foto);
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      console.log("ERROR: No valid data to update");
      return res.status(400).json({ message: "No valid data provided for update." });
    }

    console.log("Final update data:", updateData);

    // Build update query
    const fields = Object.keys(updateData);
    const placeholders = fields.map(() => '?').join(', ');
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    const updateQuery = `UPDATE registration SET ${setClause} WHERE id = ?`;
    const queryValues = [...Object.values(updateData), id];
    
    console.log("Update query:", updateQuery);
    console.log("Query values:", queryValues);

    // Execute update
    const [updateResult] = await db.execute(updateQuery, queryValues);
    console.log("Update result:", updateResult);

    if (updateResult.affectedRows === 0) {
      console.log("WARNING: No rows were affected");
      return res.status(404).json({ message: "No data was updated. Record may not exist." });
    }
    
    console.log("=== UPDATE SUCCESSFUL ===");
    res.status(200).json({ 
      message: `Update successful for id ${id}`,
      updatedFields: fields,
      affectedRows: updateResult.affectedRows
    });

  } catch (err) {
    console.error('=== UPDATE ERROR ===');
    console.error('Error details:', err);
    console.error('Stack trace:', err.stack);
    
    res.status(500).json({ 
      message: "Failed to update registration data", 
      error: err.message,
      errorCode: err.code || 'UNKNOWN_ERROR'
    });
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