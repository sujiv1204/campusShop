const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

router.post("/register", authController.register);
router.get("/verify-email", authController.verifyEmail);
router.post("/login", authController.login);
router.post("/logout", authController.logout);

// GET /api/auth/user/:id - Get user details (for internal use)
router.get("/user/:id", authController.getUserById);

module.exports = router;
