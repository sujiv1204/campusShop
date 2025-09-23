const express = require("express");
const router = express.Router();
const bidController = require("../controllers/bid.controller");
const verifyToken = require("../middleware/auth.middleware"); 
// POST /api/bids - Place a new bid
router.post("/", verifyToken, bidController.placeBid);

module.exports = router;
