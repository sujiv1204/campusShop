const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { loginLimiter } = require("../../middleware/rateLimit");

router.post("/register", authController.register);
router.get("/verify-email", authController.verifyEmail);
router.post("/login", loginLimiter, authController.login);

// router.post("/login", authController.login);
router.post("/logout", authController.logout);
// router.post("/forgot-password", authController.resetPasswordWithoutEmail);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// GET /api/auth/user/:id - Get user details (for internal use)
router.get("/user/:id", authController.getUserById);

module.exports = router;
