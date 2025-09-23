const db = require("../models");
const Item = db.Item;
const minioClient = require("../config/minioClient");
const crypto = require("crypto");
const { validate: isUuid } = require("uuid");
// Controller method for creating a new item
exports.createItem = async (req, res) => {
    // For now, we'll get sellerId from the request body.
    // Later, this will come from the JWT token.
    const { title, description, price } = req.body;
    const sellerId = req.user.userId;

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
            // imageUrl will be added later
        });

        res.status(201).json(newItem);
    } catch (error) {
        console.error("Error creating item:", error);
        res.status(500).json({ message: "Server error while creating item." });
    }
};

// Controller method for getting all items
exports.getAllItems = async (req, res) => {
    try {
        const items = await Item.findAll({ where: { status: "available" } });
        res.status(200).json(items);
    } catch (error) {
        console.error("Error fetching items:", error);
        res.status(500).json({ message: "Server error while fetching items." });
    }
};

// Controller method for getting a single item by ID
exports.getItemById = async (req, res) => {
    try {
        const { id } = req.params; // Get the ID from the URL parameters
        if (!isUuid(id)) {
            return res.status(400).json({ message: "Invalid item ID format." });
        }
        const item = await Item.findByPk(id);

        // If no item is found with that ID, return a 404 error
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

        // Check if a file was uploaded
        if (!req.file) {
            return res.status(400).json({ message: "No image file uploaded." });
        }

        // --- START: Authorization Check ---
        // Verify that the logged-in user is the seller of the item.
        if (item.sellerId !== req.user.userId) {
            return res.status(403).json({
                message:
                    "Forbidden: You can only upload images for your own items.",
            });
        }

        const bucketName = process.env.MINIO_BUCKET;
        // Create a unique object name for the file
        const objectName = `${Date.now()}_${crypto
            .randomBytes(8)
            .toString("hex")}_${req.file.originalname}`;

        // Create the bucket if it doesn't exist
        const bucketExists = await minioClient.bucketExists(bucketName);
        if (!bucketExists) {
            await minioClient.makeBucket(bucketName, "us-east-1");
            console.log(`Bucket ${bucketName} created.`);
        }

        // Upload the file to MinIO
        await minioClient.putObject(
            bucketName,
            objectName,
            req.file.buffer,
            req.file.mimetype
        );

        // Construct the URL
        const imageUrl = `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucketName}/${objectName}`;

        // Update the item in the database with the new image URL
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

        // In the future, you'll add an authorization check here
        // to ensure the person making the request is the item's seller.
        if (item.sellerId !== req.user.userId) {
            return res.status(403).json({
                message: "Forbidden: You can only update your own items.",
            });
        }

        // Update the item's properties
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

        // Add authorization check here as well in the future.
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

exports.markAsSold = async (req, res) => {
    try {
        const item = await Item.findByPk(req.params.id);
        if (!item) return res.status(404).json({ message: "Item not found." });

        // Authorization check
        if (item.sellerId !== req.user.userId) {
            return res
                .status(403)
                .json({ message: "You can only update your own items." });
        }
        if (item.status === "sold") {
            return res.status(400).json({ message: "Item is already sold." });
        }

        item.status = "sold";
        await item.save();
        res.status(200).json(item);
    } catch (error) {
        console.error("Error marking item as sold:", error);
        res.status(500).json({ message: "Server error." });
    }
};
