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

exports.getMyProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get user email from auth service
        try {
            const userResponse = await axios.get(
                `${process.env.AUTH_SERVICE_URL}/api/auth/user/${userId}`
            );

            // Get profile from database
            let profile = await Profile.findByPk(userId);

            // If profile doesn't exist, return basic info with email
            if (!profile) {
                return res.status(200).json({
                    userId: userId,
                    email: userResponse.data.email,
                    displayName: null,
                    phoneNumber: null,
                    profileExists: false,
                });
            }

            // Return profile with email from auth service
            res.status(200).json({
                ...profile.toJSON(),
                email: userResponse.data.email,
                profileExists: true,
            });
        } catch (authError) {
            console.error(
                "Error fetching user from auth service:",
                authError.message
            );
            console.error("AUTH_SERVICE_URL:", process.env.AUTH_SERVICE_URL);

            // Fallback: return profile without email
            let profile = await Profile.findByPk(userId);

            if (!profile) {
                return res.status(200).json({
                    userId: userId,
                    email: "N/A (Auth service unavailable)",
                    displayName: null,
                    phoneNumber: null,
                    profileExists: false,
                });
            }

            res.status(200).json({
                ...profile.toJSON(),
                email: "N/A (Auth service unavailable)",
                profileExists: true,
            });
        }
    } catch (error) {
        console.error("Error fetching my profile:", error);
        res.status(500).json({ message: "Server error." });
    }
};

exports.upsertProfile = async (req, res) => {
    const userId = req.user.userId;
    const { displayName, phoneNumber } = req.body;
    if (!displayName)
        return res.status(400).json({ message: "Display name is required." });
    try {
        // Get user email from auth service
        const userResponse = await axios.get(
            `${process.env.AUTH_SERVICE_URL}/api/auth/user/${userId}`
        );

        const [profile] = await Profile.upsert({
            userId,
            displayName,
            phoneNumber,
        });

        // Return profile with email
        res.status(200).json({
            ...profile.toJSON(),
            email: userResponse.data.email,
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Server error." });
    }
};

exports.getPostedItems = async (req, res) => {
    try {
        const sellerId = req.user.userId;
        const response = await axios.get(
            `${process.env.ITEMS_SERVICE_URL}/api/items?sellerId=${sellerId}&status=available`,
            {
                headers: { Authorization: req.headers["authorization"] }, // Forward the auth header
            }
        );

        // Handle paginated response from items-service
        const items = response.data.items || response.data;
        res.json(Array.isArray(items) ? items : []);
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
            `${process.env.ITEMS_SERVICE_URL}/api/items?sellerId=${sellerId}&status=sold`,
            { headers: { Authorization: req.headers["authorization"] } }
        );

        // Handle paginated response from items-service
        let soldItems = itemsResponse.data.items || itemsResponse.data;

        // Ensure soldItems is an array
        if (!soldItems) {
            return res.json([]);
        }

        if (!Array.isArray(soldItems)) {
            console.error("Sold items is not an array:", soldItems);
            return res.json([]);
        }

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
                    `${process.env.BIDDING_SERVICE_URL}/api/bids/item/${item.id}`,
                    { headers: { Authorization: req.headers["authorization"] } }
                );
                const winningBid = bidsResponse.data[0];

                if (winningBid) {
                    enrichedItem.finalPrice = winningBid.amount;

                    // 3. Get buyer's email from auth service
                    const authResponse = await axios.get(
                        `${process.env.AUTH_SERVICE_URL}/api/auth/user/${winningBid.bidderId}`
                    );

                    // 4. Try to get buyer's profile (name and phone)
                    let buyerProfile = null;
                    try {
                        buyerProfile = await Profile.findByPk(
                            winningBid.bidderId
                        );
                    } catch (profileError) {
                        console.log(
                            `No profile found for buyer ${winningBid.bidderId}`
                        );
                    }

                    enrichedItem.soldTo = {
                        email: authResponse.data.email,
                        name: buyerProfile?.displayName || null,
                        phone: buyerProfile?.phoneNumber || null,
                    };
                }
            } catch (error) {
                console.error(
                    `Could not fetch full details for sold item ${item.id}:`,
                    error.message
                );
            }
            itemsWithFullInfo.push(enrichedItem);
        }

        res.json(itemsWithFullInfo);
    } catch (error) {
        console.error(
            "Error fetching sold items:",
            error.response ? error.response.data : error.message
        );
        console.error("Full error:", error);
        res.status(500).json({ message: "Could not fetch sold items." });
    }
};

exports.getUserBids = async (req, res) => {
    try {
        const bidderId = req.user.userId;
        // 1. Get all bids placed by the user from the bidding-service
        const bidsResponse = await axios.get(
            `${process.env.BIDDING_SERVICE_URL}/api/bids?bidderId=${bidderId}`,
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
                    `${process.env.ITEMS_SERVICE_URL}/api/items/${bid.itemId}`
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
            `${process.env.BIDDING_SERVICE_URL}/api/bids?bidderId=${bidderId}`,
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
                    `${process.env.ITEMS_SERVICE_URL}/api/items/${bid.itemId}`
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

exports.getPurchasedItems = async (req, res) => {
    try {
        const buyerId = req.user.userId;
        const bidsResponse = await axios.get(
            `${process.env.BIDDING_SERVICE_URL}/api/bids?bidderId=${buyerId}`,
            { headers: { Authorization: req.headers["authorization"] } }
        );
        const userBids = bidsResponse.data;

        const purchasedItems = [];
        for (const bid of userBids) {
            try {
                const itemResponse = await axios.get(
                    `${process.env.ITEMS_SERVICE_URL}/api/items/${bid.itemId}`
                );

                // Only include items that are sold
                if (itemResponse.data.status === "sold") {
                    // Get all bids for this item to find the winning bid
                    const itemBidsResponse = await axios.get(
                        `${process.env.BIDDING_SERVICE_URL}/api/bids/item/${bid.itemId}`,
                        {
                            headers: {
                                Authorization: req.headers["authorization"],
                            },
                        }
                    );
                    const allItemBids = itemBidsResponse.data;

                    // Find the winning bid (highest amount)
                    const winningBid = allItemBids.reduce(
                        (highest, current) => {
                            return parseFloat(current.amount) >
                                parseFloat(highest.amount)
                                ? current
                                : highest;
                        },
                        allItemBids[0]
                    );

                    // Only include if this user's bid was the winning bid
                    const bidId = bid.id || bid._id;
                    const winningBidId = winningBid.id || winningBid._id;

                    if (bidId === winningBidId) {
                        // Fetch seller email from auth service
                        let sellerInfo = {
                            email: "N/A",
                            name: null,
                            phone: null,
                        };
                        try {
                            const sellerResponse = await axios.get(
                                `${process.env.AUTH_SERVICE_URL}/api/auth/user/${itemResponse.data.sellerId}`
                            );
                            sellerInfo.email =
                                sellerResponse.data.email || "N/A";

                            // Try to get seller's profile
                            try {
                                const sellerProfile = await Profile.findByPk(
                                    itemResponse.data.sellerId
                                );
                                if (sellerProfile) {
                                    sellerInfo.name = sellerProfile.displayName;
                                    sellerInfo.phone =
                                        sellerProfile.phoneNumber;
                                }
                            } catch (profileError) {
                                console.log(
                                    `No profile found for seller ${itemResponse.data.sellerId}`
                                );
                            }
                        } catch (sellerError) {
                            console.log(
                                `Could not fetch seller info for item ${bid.itemId}:`,
                                sellerError.message
                            );
                        }

                        purchasedItems.push({
                            ...itemResponse.data,
                            bidId: bidId,
                            purchasePrice: bid.amount,
                            purchasedAt: bid.createdAt,
                            sellerEmail: sellerInfo.email,
                            sellerName: sellerInfo.name,
                            sellerPhone: sellerInfo.phone,
                        });
                    }
                }
            } catch (itemError) {
                console.log(
                    `Could not fetch item ${bid.itemId}:`,
                    itemError.message
                );
            }
        }

        res.json(purchasedItems);
    } catch (error) {
        console.error("Error fetching purchased items:", error.message);
        res.status(500).json({ message: "Could not fetch purchased items." });
    }
};
