// const multer = require("multer");
// const path = require("path");

// // Konfigurasi penyimpanan file
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/"); // Folder penyimpanan
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname)); // Nama unik
//   },
// });

// const upload = multer({ storage: storage });

// module.exports = upload;
