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
