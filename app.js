const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const registrationRoutes = require('./src/routes/registrationRoutes');
const userRoutes = require('./src/routes/userRoutes');
const multer = require("multer");
const exportRoutes = require('./src/routes/exportRoutes');


require('dotenv').config();

const app = express();
const PORT = process.env.PORT;

const dbPath = path.join(__dirname, 'data', 'database.db');
console.log('dbPath', dbPath);
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening database:", err);
    } else {
        console.log("Database Connected");
    }
});

//middleware CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN, 
    methods: ["GET", "POST", "PUT", "DELETE"], 
    credentials: true, 
}));


//middleware untuk parsing JSON
app.use(express.json());

//rute API
app.use("/registration", registrationRoutes);
app.use("/users", userRoutes);
app.use("/export",exportRoutes);

// Setup view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

// folder statis untuk akses file upload
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//jalankan server
app.listen(PORT, () => {
    console.log(`Running in http://localhost:${PORT}`);
});


