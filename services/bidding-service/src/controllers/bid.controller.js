const axios = require("axios");
const db = require("../models");
const { publishBidPlacedEvent } = require("../lib/kafka");
const Bid = db.Bid;

exports.placeBid = async (req, res) => {
    // The bidder's ID will come from the JWT token
    const bidderId = req.user.userId;
    const { itemId, amount } = req.body;

    if (!itemId || !amount) {
        return res
            .status(400)
            .json({ message: "Item ID and amount are required." });
    }

    try {
        // --- Business Logic Checks ---
        // 1. Fetch item details from the items-service
        const itemResponse = await axios.get(
            `http://items-service:5002/api/items/${itemId}`
        );
        const item = itemResponse.data;

        // 2. Check if the bidder is the seller
        if (item.sellerId === bidderId) {
            return res
                .status(403)
                .json({ message: "You cannot bid on your own item." });
        }

        // 3. Check if the bid amount is high enough
        if (parseFloat(amount) < parseFloat(item.price)) {
            return res.status(400).json({
                message: `Bid must be at least the starting price of ₹${item.price}.`,
            });
        }
        // --- End Business Logic Checks ---
        const newBid = await Bid.create({
            itemId,
            bidderId,
            amount,
        });
        await publishBidPlacedEvent(newBid);
        res.status(201).json(newBid);
    } catch (error) {
        console.error("Error placing bid:", error);
        res.status(500).json({ message: "Server error while placing bid." });
    }
};
// Add this new controller function
exports.getBidsForUser = async (req, res) => {
    try {
        // This allows fetching bids for the logged-in user OR another user if an admin feature is added later
        const bidderId = req.query.bidderId || req.user.userId;

        const bids = await Bid.findAll({ where: { bidderId: bidderId } });
        res.status(200).json(bids);
    } catch (error) {
        console.error("Error fetching bids:", error);
        res.status(500).json({ message: "Server error while fetching bids." });
    }
};
