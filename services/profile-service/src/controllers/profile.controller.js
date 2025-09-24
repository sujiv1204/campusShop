const axios = require("axios");
const db = require("../models");
const Profile = db.Profile;

exports.getProfile = async (req, res) => {
    try {
        const profile = await Profile.findByPk(req.params.userId);
        if (!profile)
            return res.status(404).json({ message: "Profile not found." });
        res.status(200).json(profile);
    } catch (error) {
        res.status(500).json({ message: "Server error." });
    }
};

exports.upsertProfile = async (req, res) => {
    const userId = req.user.userId;
    const { displayName, phoneNumber } = req.body;
    if (!displayName)
        return res.status(400).json({ message: "Display name is required." });
    try {
        const [profile] = await Profile.upsert({
            userId,
            displayName,
            phoneNumber,
        });
        res.status(200).json(profile);
    } catch (error) {
        res.status(500).json({ message: "Server error." });
    }
};

exports.getPostedItems = async (req, res) => {
    try {
        const sellerId = req.user.userId;
        const response = await axios.get(
            `http://items-service:5002/api/items?sellerId=${sellerId}&status=available`,
            {
                headers: { Authorization: req.headers["authorization"] }, // Forward the auth header
            }
        );
        res.json(response.data);
    } catch (error) {
        // Log the detailed error from the downstream service
        console.error(
            "Error fetching posted items:",
            error.response ? error.response.data : error.message
        );
        res.status(500).json({ message: "Could not fetch posted items." });
    }
};

exports.getSoldItems = async (req, res) => {
    try {
        const sellerId = req.user.userId;
        const response = await axios.get(
            `http://items-service:5002/api/items?sellerId=${sellerId}&status=sold`,
            {
                headers: { Authorization: req.headers["authorization"] }, // Forward the auth header
            }
        );
        res.json(response.data);
    } catch (error) {
        // Log the detailed error from the downstream service
        console.error(
            "Error fetching sold items:",
            error.response ? error.response.data : error.message
        );
        res.status(500).json({ message: "Could not fetch sold items." });
    }
};

exports.getUserBids = async (req, res) => {
    try {
        const bidderId = req.user.userId;
        const response = await axios.get(
            `http://bidding-service:5003/api/bids?bidderId=${bidderId}`,
            {
                headers: { Authorization: req.headers["authorization"] },
            }
        );
        res.json(response.data);
    } catch (error) {
        // Log the detailed error from the downstream service
        console.error(
            "Error fetching user bids:",
            error.response ? error.response.data : error.message
        );
        res.status(500).json({ message: "Could not fetch user bids." });
    }
};

exports.getActiveBids = async (req, res) => {
    try {
        const bidderId = req.user.userId;
        const bidsResponse = await axios.get(
            `http://bidding-service:5003/api/bids?bidderId=${bidderId}`,
            {
                headers: { Authorization: req.headers["authorization"] },
            }
        );
        const allBids = bidsResponse.data;
        if (allBids.length === 0) return res.json([]);

        const activeBids = [];
        for (const bid of allBids) {
            try {
                const itemResponse = await axios.get(
                    `http://items-service:5002/api/items/${bid.itemId}`
                );
                if (
                    itemResponse.data &&
                    itemResponse.data.status === "available"
                ) {
                    activeBids.push({ ...bid, item: itemResponse.data });
                }
            } catch (itemError) {
                // Item might be deleted, so we just skip it
                console.log(
                    `Skipping bid on item ${bid.itemId} as it could not be found.`
                );
            }
        }

        res.json(activeBids);
    } catch (error) {
        console.error("Error fetching active bids:", error.message);
        res.status(500).json({ message: "Could not fetch active bids." });
    }
};
