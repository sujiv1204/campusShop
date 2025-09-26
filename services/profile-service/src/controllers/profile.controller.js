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
        // 1. Get all items the user has marked as 'sold' from the items-service
        const itemsResponse = await axios.get(
            `http://items-service:5002/api/items?sellerId=${sellerId}&status=sold`,
            { headers: { Authorization: req.headers["authorization"] } }
        );
        const soldItems = itemsResponse.data;
        if (soldItems.length === 0) {
            return res.json([]);
        }

        // 2. For each sold item, find the winning bidder and their profile
        const itemsWithFullInfo = [];
        for (const item of soldItems) {
            let enrichedItem = { ...item };
            try {
                // Call the bidding-service to get the winning bid
                const bidsResponse = await axios.get(
                    `http://bidding-service:5003/api/bids/item/${item.id}`,
                    { headers: { Authorization: req.headers["authorization"] } }
                );
                const winningBid = bidsResponse.data[0];
                console.log(bidsResponse.data)

                if (winningBid) {
                    enrichedItem.finalPrice = winningBid.amount;
                    
                    // 3. Call the profile-service to get the winner's display name
                    const profileResponse = await axios.get(
                        `http://auth-service:5001/api/auth/user/${winningBid.bidderId}`,
                        //  { headers: { Authorization: req.headers["authorization"] } }
                    );
                    enrichedItem.soldTo = profileResponse.data; // Attach the full profile object
                }
            } catch (error) {
                // If fetching extra info fails, just include what we have
                console.error(`Could not fetch full details for sold item ${item.id}:`, error.message);
            }
            itemsWithFullInfo.push(enrichedItem);
        }

        res.json(itemsWithFullInfo);

    } catch (error) {
        console.error("Error fetching sold items:", error.response ? error.response.data : error.message);
        res.status(500).json({ message: "Could not fetch sold items." });
    }
};

exports.getUserBids = async (req, res) => {
    try {
        const bidderId = req.user.userId;
        // 1. Get all bids placed by the user from the bidding-service
        const bidsResponse = await axios.get(
            `http://bidding-service:5003/api/bids?bidderId=${bidderId}`,
            {
                headers: { Authorization: req.headers["authorization"] },
            }
        );
        const userBids = bidsResponse.data;
        if (userBids.length === 0) {
            return res.json([]);
        }

        // 2. For each bid, get the status of the item from the items-service
        const bidsWithStatus = [];
        for (const bid of userBids) {
            try {
                const itemResponse = await axios.get(
                    `http://items-service:5002/api/items/${bid.itemId}`
                );
                // 3. Attach the item's status and title to the bid object
                bidsWithStatus.push({
                    ...bid,
                    itemStatus: itemResponse.data.status,
                    itemTitle: itemResponse.data.title,
                });
            } catch (itemError) {
                // If item was deleted, we can mark it as such
                bidsWithStatus.push({
                    ...bid,
                    itemStatus: "deleted",
                    itemTitle: "Deleted Item",
                });
            }
        }

        res.json(bidsWithStatus);

    } catch (error) {
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
