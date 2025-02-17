const express = require("express");
const cors = require("cors"); // Import cors
const sqlite3 = require("sqlite3").verbose();
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = 3000;

const db = new sqlite3.Database("./db/database.db", (err) => {
    if (err) {
        console.error("Error opening database:", err);
    } else {
        console.log("Database Connected");
    }
});

// Middleware CORS untuk mengizinkan akses dari frontend
app.use(cors({
    origin: "http://localhost:5173", // URL Frontend
    methods: ["GET", "POST", "PUT", "DELETE"], // Method yang diizinkan
    credentials: true, // Jika perlu mengirim cookies atau header auth
}));

app.use(express.json());
app.use("/registration", userRoutes);

app.listen(PORT, () => {
    console.log(`Running in http://localhost:${PORT}`);
});
