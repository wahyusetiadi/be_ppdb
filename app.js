const express = require("express");
const cors = require("cors");
const path = require("path");


require('dotenv').config();

const registrationRoutes = require('./src/routes/registrationRoutes');
const userRoutes = require('./src/routes/userRoutes');
const exportRoutes = require('./src/routes/exportRoutes');

const app = express();
const PORT = process.env.PORT;

const allowedOrigins = [
    'http://kevin.edunex.id:3352',
    'http://localhost:3000'
]

app.use(cors({
    origin: function (origin, callback) {
        if(!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true,
}));

app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// setup view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

// rute API
app.use("/registration", registrationRoutes);
app.use("/users", userRoutes);
app.use("/export", exportRoutes);

// jalankan server
app.listen(PORT, () => {
    console.log(`Running on http://localhost:${PORT}`);
});
