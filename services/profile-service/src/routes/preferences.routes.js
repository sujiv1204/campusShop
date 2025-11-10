const express = require("express");
const router = express.Router();
const preferencesController = require("../controllers/preferences.controller");
const authenticateToken = require("../middleware/auth.middleware");

router.get("/", authenticateToken, preferencesController.getPreferences);
router.patch("/", authenticateToken, preferencesController.updatePreferences);

module.exports = router;
