const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profile.controller");
const verifyToken = require("../middleware/auth.middleware");

router.get("/:userId", verifyToken, profileController.getProfile);
router.put("/me", verifyToken, profileController.upsertProfile);


router.get('/me/items/posted', verifyToken, profileController.getPostedItems);
router.get('/me/items/sold', verifyToken, profileController.getSoldItems);
router.get('/me/bids', verifyToken, profileController.getUserBids);
router.get('/me/bids/active', verifyToken, profileController.getActiveBids);
module.exports = router;
