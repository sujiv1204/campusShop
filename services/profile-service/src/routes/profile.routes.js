const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profile.controller");
const verifyToken = require("../middleware/auth.middleware");

router.get("/:userId", verifyToken, profileController.getProfile);
router.put("/me", verifyToken, profileController.upsertProfile);

module.exports = router;
