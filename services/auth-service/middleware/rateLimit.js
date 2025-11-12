const rateLimit = require("express-rate-limit");

// Basic IP-based rate limit for login endpoint
const loginLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // allow 5 login attempts per minute per IP
    message: {
        message: "Too many login attempts. Please try again in a minute."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    loginLimiter,
};
