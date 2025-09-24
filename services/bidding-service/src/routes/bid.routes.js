const express = require("express");
const router = express.Router();
const bidController = require("../controllers/bid.controller");
const verifyToken = require("../middleware/auth.middleware"); 
// POST /api/bids - Place a new bid
router.post("/", verifyToken, bidController.placeBid);
// GET /api/bids - Get all bids for the authenticated user
router.get('/', verifyToken, bidController.getBidsForUser);
// GET /api/bids/item/:itemId - Get all bids for a specific item
router.get('/item/:itemId', bidController.getBidsForItem);
module.exports = router;
