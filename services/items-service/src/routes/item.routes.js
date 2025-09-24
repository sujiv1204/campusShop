const express = require("express");
const router = express.Router();

// We will create the controller logic next
const itemController = require("../controllers/item.controller");
const multer = require("multer");
// Configure multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const verifyToken = require("../middleware/auth.middleware");

// --- Public Routes ---
router.get("/", itemController.getAllItems);
router.get("/:id", itemController.getItemById);

// --- Protected Routes ---
// Any route below this will first run the verifyToken middleware
router.post("/", verifyToken, itemController.createItem);
router.put("/:id", verifyToken, itemController.updateItem);
router.delete("/:id", verifyToken, itemController.deleteItem);
router.post(
    "/:id/image",
    verifyToken,
    upload.single("itemImage"),
    itemController.uploadImage
);
router.post("/:id/sell", verifyToken, itemController.markAsSold);

module.exports = router;
