const { Kafka } = require("kafkajs");
const axios = require("axios");
const nodemailer = require("nodemailer");
require("dotenv").config();

const kafka = new Kafka({
    clientId: "notifications-service",
    brokers: [process.env.KAFKA_BROKER],
});
const consumer = kafka.consumer({ groupId: "notifications-group" });

// --- Nodemailer Setup (using Ethereal for testing) ---
let transporter;
async function setupMailer() {
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
}

// --- Main Consumer Logic ---
const run = async () => {
    await setupMailer();
    await consumer.connect();
    // Subscribe to both topics with fromBeginning: true
    await consumer.subscribe({ topic: "bids-topic", fromBeginning: true });
    await consumer.subscribe({ topic: "items-topic", fromBeginning: true });
    console.log("Notifications service is listening for events...");

    await consumer.run({
        eachMessage: async ({ topic, message }) => {
            const event = JSON.parse(message.value.toString());

            // Check which topic the message came from and handle it accordingly
            if (topic === "bids-topic") {
                console.log("Received BidPlaced event!");
                await handleBidPlaced(event);
            }

            if (topic === "items-topic" && event.eventType === "ItemSold") {
                console.log("Received ItemSold event!");
                await handleItemSold(event.payload);
            }
        },
    });
};

async function handleBidPlaced(event) {
    try {
        // 1. Get item details to find the seller's ID
        const itemResponse = await axios.get(
            `${process.env.ITEMS_SERVICE_URL}/api/items/${event.itemId}`
        );
        const item = itemResponse.data;
        const sellerId = item.sellerId;

        // 2. Get the seller's and bidder's details
        const sellerResponse = await axios.get(
            `${process.env.AUTH_SERVICE_URL}/api/auth/user/${sellerId}`
        );
        const bidderResponse = await axios.get(
            `${process.env.AUTH_SERVICE_URL}/api/auth/user/${event.bidderId}`
        );

        const sellerEmail = sellerResponse.data.email;
        const bidderEmail = bidderResponse.data.email;

        // 3. Construct and send the email to the seller
        const mailInfo = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: sellerEmail,
            subject: `New Bid on Your Item: "${item.title}"`,
            html: `<b>Hello!</b><br/>A new bid of <b>₹${event.amount}</b> was placed on your item "${item.title}".<br/><br/>You can contact the bidder at: ${bidderEmail}`,
        });

        console.log(
            `Bid notification email sent to ${sellerEmail}. Message ID: %s`,
            mailInfo.messageId
        );
    } catch (error) {
        console.error(
            "Failed to process BidPlaced notification:",
            error.response ? error.response.data : error.message
        );
    }
}

async function handleItemSold(item) {
    try {
        // 1. Find the winning bidder (highest bid)
        const bidsResponse = await axios.get(
            `${process.env.BIDDING_SERVICE_URL}/api/bids/item/${item.id}`
        );
        const winningBid = bidsResponse.data[0];
        if (!winningBid) {
            console.log(
                `No bids found for sold item ${item.id}, no notification sent.`
            );
            return;
        }

        // 2. Get contact info for seller and winner
        const sellerResponse = await axios.get(
            `${process.env.AUTH_SERVICE_URL}/api/auth/user/${item.sellerId}`
        );
        const winnerResponse = await axios.get(
            `${process.env.AUTH_SERVICE_URL}/api/auth/user/${winningBid.bidderId}`
        );

        const sellerEmail = sellerResponse.data.email;
        const winnerEmail = winnerResponse.data.email;

        // --- START: Nodemailer Logic ---

        // 3. Email the seller
        const sellerMailInfo = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: sellerEmail,
            subject: `Congratulations! Your item "${item.title}" has been sold.`,
            html: `
                <b>Congratulations!</b><br/>
                Your item, "${item.title}", has been sold for <b>₹${winningBid.amount}</b>.<br/><br/>
                Please contact the buyer to arrange the exchange. Their email is: ${winnerEmail}.
            `,
        });
        console.log(
            `ItemSold notification sent to seller. Message ID: %s`,
            sellerMailInfo.messageId
        );

        // 4. Email the winning bidder
        const winnerMailInfo = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: winnerEmail,
            subject: `Congratulations! You won the bid for "${item.title}".`,
            html: `
                <b>Congratulations!</b><br/>
                You are the winning bidder for the item "${item.title}" with a bid of <b>₹${winningBid.amount}</b>.<br/><br/>
                Please contact the seller to arrange the exchange. Their email is: ${sellerEmail}.
            `,
        });
        console.log(
            `ItemSold notification sent to winner. Message ID: %s`,
            winnerMailInfo.messageId
        );

        // --- END: Nodemailer Logic ---
    } catch (error) {
        console.error(
            "Failed to process ItemSold notification:",
            error.response ? error.response.data : error.message
        );
    }
}

module.exports = { run };
