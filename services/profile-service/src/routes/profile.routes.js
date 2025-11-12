const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profile.controller");
const verifyToken = require("../middleware/auth.middleware");

// Personal profile routes (must come before /:userId to avoid conflict)
router.get("/me", verifyToken, profileController.getMyProfile);
router.put("/me", verifyToken, profileController.upsertProfile);
router.get("/me/items/posted", verifyToken, profileController.getPostedItems);
router.get("/me/items/sold", verifyToken, profileController.getSoldItems);
router.get(
    "/me/items/purchased",
    verifyToken,
    profileController.getPurchasedItems
);
router.get("/me/bids", verifyToken, profileController.getUserBids);
router.get("/me/bids/active", verifyToken, profileController.getActiveBids);

// Other user's profile (must come after /me routes)
router.get("/:userId", verifyToken, profileController.getProfile);

module.exports = router;
