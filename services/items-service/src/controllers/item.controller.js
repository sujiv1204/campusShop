const db = require("../models");
const Item = db.Item;
const EventOutbox = db.EventOutbox; // Import the Outbox model
const sequelize = db.sequelize; // Import the sequelize instance
const minioClient = require("../config/minioClient");
const crypto = require("crypto");
const { validate: isUuid } = require("uuid");
const axios = require("axios");

// Controller method for creating a new item
exports.createItem = async (req, res) => {
    const { title, description, price } = req.body;
    const sellerId = req.user.userId; // Get sellerId from the JWT

    // Basic validation
    if (!title || !price || !sellerId) {
        return res
            .status(400)
            .json({ message: "Title, price, and sellerId are required." });
    }

    try {
        const newItem = await Item.create({
            title,
            description,
            price,
            sellerId,
        });

        res.status(201).json(newItem);
    } catch (error) {
        console.error("Error creating item:", error);
        res.status(500).json({ message: "Server error while creating item." });
    }
};

// Controller method for getting all items (reverted to non-paginated version)
exports.getAllItems = async (req, res) => {
    try {
        const { sellerId, status } = req.query;
        let queryOptions = {
            where: { status: status || "available" },
        };

        // If a sellerId is provided, add it to the filter
        if (sellerId) {
            queryOptions.where.sellerId = sellerId;
        }

        // Use the simple findAll, which returns just an array
        const items = await Item.findAll(queryOptions);
        res.status(200).json(items); // This returns a simple array
    } catch (error) {
        console.error("Error fetching items:", error);
        res.status(500).json({ message: "Server error while fetching items." });
    }
};

// Controller method for getting a single item by ID
exports.getItemById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isUuid(id)) {
            return res.status(400).json({ message: "Invalid item ID format." });
        }
        const item = await Item.findByPk(id);

        if (!item) {
            return res.status(404).json({ message: "Item not found." });
        }

        res.status(200).json(item);
    } catch (error) {
        console.error("Error fetching item by ID:", error);
        res.status(500).json({ message: "Server error while fetching item." });
    }
};

// Controller method for uploading an image to an item
exports.uploadImage = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await Item.findByPk(id);

        if (!item) {
            return res.status(404).json({ message: "Item not found." });
        }
        if (!req.file) {
            return res.status(400).json({ message: "No image file uploaded." });
        }
        if (item.sellerId !== req.user.userId) {
            return res.status(403).json({
                message:
                    "Forbidden: You can only upload images for your own items.",
            });
        }

        const bucketName = process.env.MINIO_BUCKET;
        const objectName = `${Date.now()}_${crypto
            .randomBytes(8)
            .toString("hex")}_${req.file.originalname}`;

        const bucketExists = await minioClient.bucketExists(bucketName);
        if (!bucketExists) {
            await minioClient.makeBucket(bucketName, "us-east-1");
            const policy = {
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Principal: "*",
                        Action: "s3:GetObject",
                        Resource: `arn:aws:s3:::${bucketName}/*`,
                    },
                ],
            };
            await minioClient.setBucketPolicy(
                bucketName,
                JSON.stringify(policy)
            );
        }

        const metadata = { "Content-Type": req.file.mimetype };
        await minioClient.putObject(
            bucketName,
            objectName,
            req.file.buffer,
            metadata
        );

        const imageUrl = `${process.env.MINIO_PUBLIC_URL}/${bucketName}/${objectName}`;
        item.imageUrl = imageUrl;
        await item.save();

        res.status(200).json({ message: "Image uploaded successfully.", item });
    } catch (error) {
        console.error("Error uploading image:", error);
        res.status(500).json({
            message: "Server error while uploading image.",
        });
    }
};

// Controller method for updating an item
exports.updateItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, price } = req.body;

        const item = await Item.findByPk(id);
        if (!item) {
            return res.status(404).json({ message: "Item not found." });
        }

        if (item.sellerId !== req.user.userId) {
            return res.status(403).json({
                message: "Forbidden: You can only update your own items.",
            });
        }

        item.title = title || item.title;
        item.description = description || item.description;
        item.price = price || item.price;

        await item.save();
        res.status(200).json(item);
    } catch (error) {
        console.error("Error updating item:", error);
        res.status(500).json({ message: "Server error while updating item." });
    }
};

// Controller method for deleting an item
exports.deleteItem = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await Item.findByPk(id);

        if (!item) {
            return res.status(404).json({ message: "Item not found." });
        }
        if (item.sellerId !== req.user.userId) {
            return res.status(403).json({
                message: "Forbidden: You can only delete your own items.",
            });
        }
        await item.destroy();
        res.status(200).json({ message: "Item deleted successfully." });
    } catch (error) {
        console.error("Error deleting item:", error);
        res.status(500).json({ message: "Server error while deleting item." });
    }
};

// Controller method for marking an item as sold
exports.markAsSold = async (req, res) => {
    const t = await sequelize.transaction(); // Start transaction
    try {
        const item = await Item.findByPk(req.params.id, { transaction: t });
        if (!item) {
            await t.rollback();
            return res.status(404).json({ message: "Item not found." });
        }
        if (item.sellerId !== req.user.userId) {
            await t.rollback();
            return res
                .status(403)
                .json({ message: "You can only update your own items." });
        }
        if (item.status === "sold") {
            await t.rollback();
            return res.status(400).json({ message: "Item is already sold." });
        }

        // 1. Update the item status
        item.status = "sold";
        await item.save({ transaction: t });

        // 2. Gather "Fat Event" data
        let eventPayload = { item: item.toJSON() };
        try {
            const bidsResponse = await axios.get(
                `${process.env.BIDDING_SERVICE_URL}/api/bids/item/${item.id}`,
                {
                    headers: { Authorization: req.headers["authorization"] },
                }
            );
            const winningBid = bidsResponse.data[0];

            if (winningBid) {
                const sellerResponse = await axios.get(
                    `${process.env.AUTH_SERVICE_URL}/api/auth/user/${item.sellerId}`
                );
                const winnerResponse = await axios.get(
                    `${process.env.AUTH_SERVICE_URL}/api/auth/user/${winningBid.bidderId}`
                );

                eventPayload.winningBid = winningBid;
                eventPayload.sellerEmail = sellerResponse.data.email;
                eventPayload.winnerEmail = winnerResponse.data.email;
            }
        } catch (eventError) {
            console.error(
                "Failed to gather full event data for ItemSold.",
                eventError.message
            );
        }

        // 3. Create the outbox event
        await EventOutbox.create(
            {
                topic: "items-topic",
                payload: { eventType: "ItemSold", payload: eventPayload },
                status: "pending",
            },
            { transaction: t }
        );

        // 4. Commit the transaction
        await t.commit();

        res.status(200).json(item);
    } catch (error) {
        await t.rollback();
        console.error("Error marking item as sold:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// Controller method for getting bids for a seller's items
exports.getBidsForSellerItems = async (req, res) => {
    try {
        const sellerId = req.user.userId;

        const items = await Item.findAll({ where: { sellerId } });
        if (items.length === 0) {
            return res.status(200).json([]);
        }

        const itemsWithBids = [];
        for (const item of items) {
            try {
                const bidsResponse = await axios.get(
                    `${process.env.BIDDING_SERVICE_URL}/api/bids/item/${item.id}`,
                    {
                        headers: {
                            Authorization: req.headers["authorization"],
                        },
                    }
                );
                itemsWithBids.push({
                    ...item.toJSON(),
                    bids: bidsResponse.data,
                });
            } catch (bidError) {
                itemsWithBids.push({ ...item.toJSON(), bids: [] });
            }
        }

        res.status(200).json(itemsWithBids);
    } catch (error) {
        console.error("Error fetching bids for seller's items:", error);
        res.status(500).json({ message: "Server error." });
    }
};
