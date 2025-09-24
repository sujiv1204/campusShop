const express = require("express");
const router = express.Router();
const bidController = require("../controllers/bid.controller");
const verifyToken = require("../middleware/auth.middleware"); 
// POST /api/bids - Place a new bid
router.post("/", verifyToken, bidController.placeBid);
// GET /api/bids - Get all bids for the authenticated user
router.get('/', verifyToken, bidController.getBidsForUser);
module.exports = router;
