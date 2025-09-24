const jwt = require("jsonwebtoken");
require("dotenv").config();
module.exports = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token)
        return res.status(403).json({ message: "A token is required." });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return res.status(401).json({ message: "Invalid Token." });
    }
    return next();
};
