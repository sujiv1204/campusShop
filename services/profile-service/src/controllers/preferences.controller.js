const db = require("../models");
const Profile = db.Profile;

exports.getPreferences = async (req, res) => {
    try {
        const userId = req.user.userId;

        let profile = await Profile.findByPk(userId);

        if (!profile) {
            // Create profile with default preferences if it doesn't exist
            profile = await Profile.create({
                userId: userId,
                displayName: req.user.email || "User",
                emailPreferences: {
                    bidReceived: true,
                    itemSold: true,
                    bidWon: true,
                },
            });
        }

        // Ensure emailPreferences exists
        const preferences = profile.emailPreferences || {
            bidReceived: true,
            itemSold: true,
            bidWon: true,
        };

        res.json(preferences);
    } catch (error) {
        console.error("Error fetching email preferences:", error);
        res.status(500).json({
            message: "Failed to fetch email preferences",
            error: error.message,
        });
    }
};

exports.updatePreferences = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { bidReceived, itemSold, bidWon } = req.body;

        // Force using primary database for write operations
        let profile = await Profile.findByPk(userId, { useMaster: true });

        if (!profile) {
            // Create profile if it doesn't exist
            profile = await Profile.create({
                userId: userId,
                displayName: req.user.email || "User",
                emailPreferences: {
                    bidReceived: bidReceived !== undefined ? bidReceived : true,
                    itemSold: itemSold !== undefined ? itemSold : true,
                    bidWon: bidWon !== undefined ? bidWon : true,
                },
            });
        } else {
            // Update existing preferences
            const currentPreferences = profile.emailPreferences || {};
            profile.emailPreferences = {
                bidReceived:
                    bidReceived !== undefined
                        ? bidReceived
                        : currentPreferences.bidReceived !== undefined
                        ? currentPreferences.bidReceived
                        : true,
                itemSold:
                    itemSold !== undefined
                        ? itemSold
                        : currentPreferences.itemSold !== undefined
                        ? currentPreferences.itemSold
                        : true,
                bidWon:
                    bidWon !== undefined
                        ? bidWon
                        : currentPreferences.bidWon !== undefined
                        ? currentPreferences.bidWon
                        : true,
            };
            // Force save to primary database
            await profile.save({ useMaster: true });
        }

        res.json(profile.emailPreferences);
    } catch (error) {
        console.error("Error updating email preferences:", error);
        res.status(500).json({
            message: "Failed to update email preferences",
            error: error.message,
        });
    }
};
