// mailer.js
require("dotenv").config();
const nodemailer = require("nodemailer");

// GANTI dengan email aplikasi kamu dan app password Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendRegistrationEmail = (to, id) => {
  const link = `https://ppdb.edunex.id/api/bukti-pendaftaran/${id}`; // GANTI ke link frontend kamu

  const mailOptions = {
    from: `PPDB Admin <${process.env.EMAIL_USER}>`,
    to,
    subject: "Bukti Pendaftaran PPDB",
    html: `
      <h3>Selamat, pendaftaran berhasil!</h3>
      <p>Silakan klik link berikut untuk melihat bukti pendaftaran Anda:</p>
      <a href="${link}">Lihat bukti pendaftaran</a>
      <br><br>
      <p>Terima kasih telah mendaftar.</p>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = sendRegistrationEmail;
