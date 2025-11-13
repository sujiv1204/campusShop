// const Redis = require("ioredis");
// const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// const MAX_ATTEMPTS = 5;
// const WINDOW = 60; // seconds

// async function accountLimiter(req, res, next) {
//     const email = req.body.email;

//     if (!email) return next(); // cannot rate limit without email

//     const key = `login_attempts:${email}`;

//     // Get current count
//     let attempts = await redis.get(key);
//     attempts = attempts ? parseInt(attempts) : 0;

//     if (attempts >= MAX_ATTEMPTS) {
//         return res.status(429).json({
//             message: "Account locked due to too many failed attempts. Try again in 1 minute."
//         });
//     }

//     // Attach redis key to request so controller can update it
//     req.loginAttemptKey = key;
//     req.currentAttempts = attempts;

//     next();
// }

// module.exports = accountLimiter;
