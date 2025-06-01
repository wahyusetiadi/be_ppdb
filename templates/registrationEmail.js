require("dotenv").config();

const generateRegistrationEmail = (id) => {
    const baseUrl = process.env.APP_BASE_URL;
    const link = `${baseUrl}/bukti-pendaftaran/${id}`;

    return {
        subject: "Bukti pendaftaran PPDB",
        html: `
      <h3>Selamat, pendaftaran berhasil!</h3>
      <p>Silakan klik link berikut untuk melihat bukti pendaftaran Anda:</p>
      <a href="${link}">Lihat bukti pendaftaran</a>
      <br><br>
      <p>Terima kasih telah mendaftar.</p>
    `, 
    };
}

module.exports = generateRegistrationEmail;