const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require ("dotenv")

dotenv.config();

const app = express();

//middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//import routes
const userRoutes = require("./routes/userRoutes");
app.use("/api/students", userRoutes);

//koneksi ke mongoDB
mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.log(err));

    //jalankan server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
