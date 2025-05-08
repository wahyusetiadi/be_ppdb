const express = require("express");
const router = express.Router();
const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");

const db = require("../db");

router.get("/excel", async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Pendaftar");

    // Definisi kolom Excel
    worksheet.columns = [
      { header: "ID Pendaftaran", key: "idRegistration", width: 20 },
      { header: "Nama Lengkap", key: "name", width: 25 },
      { header: "Email Aktif", key: "email", width: 15 },
      { header: "Jenis Kelamin", key: "gender", width: 15 },
      { header: "Agama", key: "religion", width: 15 },
      { header: "Tempat Lahir", key: "birthPlace", width: 20 },
      { header: "Tanggal Lahir", key: "birthDate", width: 15 },
      { header: "Alamat", key: "address", width: 25 },
      { header: "Nomor Orang Tua", key: "parentPhone", width: 15 },
      { header: "Scan Akte Kelahiran", key: "akte", width: 15 },
      { header: "Scan Kartu Keluarga", key: "familyRegister", width: 15 },
      { header: "Scan Ijazah TK", key: "tkCertificate", width: 15 },
      { header: "Pas Foto 3x4", key: "foto", width: 15 },
      { header: "Dibuat Tanggal", key: "dibuat_tanggal", width: 15 },
      { header: "Dibuat Jam", key: "dibuat_jam", width: 15 },
    ];

    // Ambil data dari database SQLite3
    db.all("SELECT * FROM registration", async (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      rows.forEach((row) => worksheet.addRow(row));

     // --- Styling Excel ---
      // Header tebal dan border
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // Border dan alignment untuk semua baris
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });
      });

      // Kirim response sebagai file Excel
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=data_pendaftar.xlsx"
      );

      workbook.xlsx.write(res).then(() => res.end());
    });
  } catch (error) {
    console.error("Gagal export Excel:", error);
    res.status(500).send("Gagal export Excel");
  }
});

module.exports = router;