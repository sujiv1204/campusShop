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
