const mongoose = require("mongoose");

const connectMongoDB = async () => {
    try {
        const mongoUri =
            process.env.MONGODB_URI ||
            "mongodb://admin:campusShop2025MongoDB!@mongodb-service:27017/notifications?authSource=admin";

        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log("MongoDB connected successfully for notification logs");

        mongoose.connection.on("error", (err) => {
            console.error("MongoDB connection error:", err);
        });

        mongoose.connection.on("disconnected", () => {
            console.warn("MongoDB disconnected. Attempting to reconnect...");
        });
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        // Don't exit process - allow service to run with PostgreSQL only
        console.warn("Service will continue without MongoDB notification logs");
    }
};

module.exports = connectMongoDB;
