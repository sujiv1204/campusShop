// const rateLimit = require("express-rate-limit");

// // Basic IP-based rate limit for login endpoint
// const loginLimiter = rateLimit({
//     windowMs: 60 * 1000, // 1 minute
//     max: 5, // allow 5 login attempts per minute per IP
//     message: {
//         message: "Too many login attempts. Please try again in a minute."
//     },
//     standardHeaders: true,
//     legacyHeaders: false,
// });

// module.exports = {
//     loginLimiter,
// };
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
/**
 * Custom Key Generator
 * This function tells the rate limiter to use the 'email' from the
 * req.body as the unique identifier instead of the IP address.
 * If no email is provided, it will (as a fallback) use the (unreliable) IP.
 */
const loginKeyGenerator = (req, res) => {
    if (req.body.email) {
        return req.body.email;
    }
    // Fallback to IP if email isn't in the body (e.g., for other routes)
    return ipKeyGenerator(req);
};

// Basic rate limit for login endpoint
const loginLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // allow 5 login attempts per minute *per email address*
    
    // Use our new key generator
    keyGenerator: loginKeyGenerator,
    
    message: {
        message: "Too many login attempts for this account. Please try again in a minute."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    loginLimiter,
};