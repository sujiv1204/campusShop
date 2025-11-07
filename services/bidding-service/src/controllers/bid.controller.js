const axios = require("axios");
const db = require("../models");
// const { publishBidPlacedEvent } = require("../lib/kafka");
const Bid = db.Bid;
const EventOutbox = db.EventOutbox; // Import the new model
const sequelize = db.sequelize; // Import the sequelize instance

exports.placeBid = async (req, res) => {
    const { itemId, amount } = req.body;
    const bidderId = req.user.userId;

    if (!itemId || !amount) {
        return res
            .status(400)
            .json({ message: "Item ID and amount are required." });
    }

    // Start a database transaction
    const t = await sequelize.transaction();

    try {
        // --- Business Logic Checks ---
        const itemResponse = await axios.get(
            `${process.env.ITEMS_SERVICE_URL}/api/items/${itemId}`
        );
        const item = itemResponse.data;

        // --- START: New "Fat Event" Logic ---
        // 1. Get all the data for the notification *before* creating the event
        const sellerResponse = await axios.get(
            `${process.env.AUTH_SERVICE_URL}/api/auth/user/${item.sellerId}`
        );
        const bidderResponse = await axios.get(
            `${process.env.AUTH_SERVICE_URL}/api/auth/user/${bidderId}`
        );

        const sellerEmail = sellerResponse.data.email;
        const bidderEmail = bidderResponse.data.email;
        const itemTitle = item.title;
        // --- END: New "Fat Event" Logic ---

        if (item.status === "sold") {
            await t.rollback(); // Rollback the transaction
            return res
                .status(403)
                .json({ message: "This item has already been sold." });
        }
        if (item.sellerId === bidderId) {
            await t.rollback();
            return res
                .status(403)
                .json({ message: "You cannot bid on your own item." });
        }
        if (parseFloat(amount) < parseFloat(item.price)) {
            await t.rollback();
            return res.status(400).json({
                message: `Bid must be at least the starting price of ₹${item.price}.`,
            });
        }
        // --- End Business Logic Checks ---

        // 1. Create the bid within the transaction
        const newBid = await Bid.create(
            { itemId, bidderId, amount },
            { transaction: t }
        );

        // 2. Create the event in the outbox table within the same transaction
        await EventOutbox.create(
            {
                topic: "bids-topic",
                payload: {
                    eventType: "BidPlaced", // <-- ADD THIS
                    payload: {
                        // <-- WRAP your data in this
                        bidId: newBid.id,
                        bidAmount: newBid.amount,
                        itemTitle: item.title,
                        sellerEmail: sellerResponse.data.email,
                        bidderEmail: bidderResponse.data.email,
                    },
                },
                status: "pending",
            },
            { transaction: t }
        );

        // 3. If both are successful, commit the transaction
        await t.commit();

        res.status(201).json(newBid);
    } catch (error) {
        // If anything fails, roll back all changes
        await t.rollback();

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
