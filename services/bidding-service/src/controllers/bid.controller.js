const axios = require("axios");
const db = require("../models");
const { publishBidPlacedEvent } = require("../lib/kafka");
const Bid = db.Bid;

exports.placeBid = async (req, res) => {
    const { itemId, amount } = req.body;
    const bidderId = req.user.userId;

    if (!itemId || !amount) {
        return res
            .status(400)
            .json({ message: "Item ID and amount are required." });
    }

    try {
        // --- Business Logic Checks ---
        const itemResponse = await axios.get(
            `http://items-service:5002/api/items/${itemId}`
        );
        const item = itemResponse.data;

        // 1. Check if the item is already sold
        if (item.status === "sold") {
            return res
                .status(403)
                .json({
                    message:
                        "This item has already been sold and is no longer available for bidding.",
                });
        }
        // 2. Check if the bidder is the seller
        if (item.sellerId === bidderId) {
            return res
                .status(403)
                .json({ message: "You cannot bid on your own item." });
        }
        // 3. Check the bid amount
        if (parseFloat(amount) < parseFloat(item.price)) {
            return res
                .status(400)
                .json({
                    message: `Bid must be at least the starting price of ₹${item.price}.`,
                });
        }
        // --- End Business Logic Checks ---

        const newBid = await Bid.create({ itemId, bidderId, amount });

        await publishBidPlacedEvent(newBid);
        res.status(201).json(newBid);
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return res
                .status(404)
                .json({ message: "Item to bid on not found." });
        }
        console.error("Error placing bid:", error);
        res.status(500).json({ message: "Server error while placing bid." });
    }
};


exports.getBidsForItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const bids = await Bid.findAll({
            where: { itemId },
            order: [["amount", "DESC"]],
        });
        res.status(200).json(bids);
    } catch (error) {
        res.status(500).json({ message: "Server error while fetching bids." });
    }
};

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
