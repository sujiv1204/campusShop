require("dotenv").config();
const express = require("express");
const db = require("./models");
const profileRoutes = require("./routes/profile.routes");

const app = express();
app.use(express.json());

app.get("/api/profiles/health", (req, res) =>
    res.send("profiles service is healthy!")
);

app.use("/api/profiles", profileRoutes);

const PORT = process.env.PORT || 5005;

db.sequelize
    .authenticate()
    .then(() => {
        console.log("Profiles database connection established.");
        app.listen(PORT, () =>
            console.log(`Profile service running on port ${PORT}`)
        );
    })
    .catch((err) =>
        console.error("Unable to connect to profiles database:", err)
    );
