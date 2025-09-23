const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
        return res
            .status(403)
            .json({ message: "A token is required for authentication." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach the decoded payload (e.g., { userId, email })
    } catch (err) {
        return res.status(401).json({ message: "Invalid Token." });
    }

    return next(); // Proceed to the next middleware or controller
};

module.exports = verifyToken;
