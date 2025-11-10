require("dotenv").config();
const express = require("express");
const db = require("./models");
const profileRoutes = require("./routes/profile.routes");
const preferencesRoutes = require("./routes/preferences.routes");
const { register, metricsMiddleware } = require("./middleware/metrics");

const app = express();
app.use(express.json());
app.use(metricsMiddleware);

app.get("/api/profiles/health", (req, res) =>
    res.send("profiles service is healthy!")
);

app.get("/metrics", async (req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
});

app.use("/api/profiles/preferences", preferencesRoutes);
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
