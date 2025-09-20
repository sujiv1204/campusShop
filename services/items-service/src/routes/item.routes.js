const express = require("express");
const router = express.Router();


// We will create the controller logic next
const itemController = require("../controllers/item.controller");
const multer = require('multer');
// Configure multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Route for creating a new item
router.post("/", itemController.createItem);

// GET /api/items - Get all items 
router.get('/', itemController.getAllItems);

// GET /api/items/:id - Get a single item by its ID 
router.get('/:id', itemController.getItemById);

// POST /api/items/:id/image - Upload an image for an item 
router.post('/:id/image', upload.single('itemImage'), itemController.uploadImage);

// PUT /api/items/:id - Update an item by its ID  
router.put('/:id', itemController.updateItem);

// DELETE /api/items/:id - Delete an item by its ID  
router.delete('/:id', itemController.deleteItem);

module.exports = router;
