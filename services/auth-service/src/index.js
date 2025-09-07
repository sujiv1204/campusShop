require("dotenv").config();
const express = require("express");
const db = require("./models");
const authRoutes = require("./routes/auth.routes");

const app = express();
app.use(express.json());

app.get("/api/auth/health", (req, res) => res.send("Auth service is healthy!"));
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5001;

db.sequelize
    .authenticate()
    .then(() => {
        console.log("Database connection has been established successfully.");
        app.listen(PORT, () => {
            console.log(`Auth service running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Unable to connect to the database:", err);
    });
