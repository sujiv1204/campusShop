const { Kafka } = require("kafkajs");
const nodemailer = require("nodemailer");
const axios = require("axios");
require("dotenv").config();
const db = require("./models"); // Import the database
const ProcessedEvent = db.ProcessedEvent; // Import the model
const Notification = require("./models/notification.model"); // MongoDB model

const kafka = new Kafka({
    clientId: "notifications-service",
    brokers: [process.env.KAFKA_BROKER],
    retry: {
        initialRetryTime: 300,
        retries: 10,
    },
});

const consumer = kafka.consumer({
    groupId: "notifications-group",
    // We add a longer session timeout as a failsafe
    sessionTimeout: 60000,
    heartbeatInterval: 3000,
});

let transporter;
const PROFILE_SERVICE_URL =
    process.env.PROFILE_SERVICE_URL ||
    "http://profile-service.campus-shop.svc.cluster.local";

// --- Helper to fetch email preferences ---
async function getEmailPreferences(userId) {
    try {
        const response = await axios.get(
            `${PROFILE_SERVICE_URL}/api/profile/preferences`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.JWT_SECRET}`,
                    "x-user-id": userId,
                },
            }
        );
        return (
            response.data.emailPreferences || {
                bidReceived: true,
                itemSold: true,
                bidWon: true,
            }
        );
    } catch (error) {
        console.error(
            `Failed to fetch email preferences for user ${userId}:`,
            error.message
        );
        return { bidReceived: true, itemSold: true, bidWon: true };
    }
}

// --- Nodemailer Setup ---
async function setupMailer() {
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
}

// --- Main Consumer Logic ---
const run = async () => {
    await setupMailer();

    // Add event listeners for resilience
    consumer.on(consumer.events.CRASH, (e) => {
        console.error("Kafka Consumer crashed. Retrying...", e);
        // The 'startConsumer' wrapper will handle restarting
    });

    consumer.on(consumer.events.DISCONNECT, (e) => {
        console.error(
            "Kafka Consumer disconnected. Kafkajs will attempt to reconnect automatically.",
            e
        );
    });

    await consumer.connect();
    await consumer.subscribe({ topic: "bids-topic", fromBeginning: true });
    await consumer.subscribe({ topic: "items-topic", fromBeginning: true });
    console.log("Notifications service is listening for events...");

    await consumer.run({
        eachMessage: async ({ topic, message }) => {
            const event = JSON.parse(message.value.toString());
            let eventId;
            let handler;

            // --- THIS IS THE FIX ---
            // We must check the standardized event envelope
            if (!event.eventType || !event.payload) {
                console.warn(
                    "Received unknown event structure, skipping:",
                    event
                );
                return;
            }

            if (topic === "bids-topic" && event.eventType === "BidPlaced") {
                eventId = event.payload.bidId; // <-- Get ID from inner payload
                handler = () => handleBidPlaced(event.payload); // <-- Pass inner payload
            } else if (
                topic === "items-topic" &&
                event.eventType === "ItemSold"
            ) {
                eventId = event.payload.item.id; // <-- Get ID from inner payload
                handler = () => handleItemSold(event.payload); // <-- Pass inner payload
            } else {
                console.warn(
                    `Received unknown event type "${event.eventType}", skipping.`
                );
                return;
            }
            // --- END FIX ---
            // --- END FIX ---

            // --- IDEMPOTENCY LOGIC ---
            let transaction;
            try {
                transaction = await db.sequelize.transaction();
                const [processed, created] = await ProcessedEvent.findOrCreate({
                    where: { eventId: eventId },
                    defaults: { eventId: eventId },
                    transaction: transaction,
                });

                if (!created) {
                    console.log(
                        `Event ${eventId} has already been processed. Skipping.`
                    );
                    await transaction.commit();
                    return; // EXIT: This stops the duplicate emails
                }

                // New event: Run the handler.
                await handler();

                await transaction.commit(); // Commit the transaction
            } catch (error) {
                if (transaction) await transaction.rollback();
                console.error(
                    `Failed to process event ${eventId}:`,
                    error.message
                );
                // We re-throw the error to signal Kafka to retry this message later
                // after the transaction has been rolled back.
                throw error;
            }
        },
    });
};

// --- Fast, "Fat Event" Handlers (No API calls) ---

async function handleBidPlaced(event) {
    const {
        sellerEmail,
        bidderEmail,
        itemTitle,
        bidAmount,
        sellerId,
        itemId,
        bidId,
    } = event;

    // Create notification in MongoDB
    await Notification.create({
        userId: sellerId,
        type: "BID_RECEIVED",
        title: `New Bid on "${itemTitle}"`,
        message: `A new bid of ₹${bidAmount} was placed on your item.`,
        metadata: {
            itemId,
            itemTitle,
            bidId,
            bidAmount,
            otherUserEmail: bidderEmail,
        },
        emailSent: false,
    });

    // Check email preferences
    const preferences = await getEmailPreferences(sellerId);
    if (!preferences.bidReceived) {
        console.log(
            `Seller ${sellerId} has disabled bid notifications. Skipping email.`
        );
        await Notification.updateOne(
            { userId: sellerId, type: "BID_RECEIVED", "metadata.bidId": bidId },
            { emailSent: true }
        );
        return;
    }

    // Send email
    const mailInfo = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: sellerEmail,
        subject: `New Bid on Your Item: "${itemTitle}"`,
        html: `
            <b>Hello!</b><br/>
            <p>A new bid of <b>₹${bidAmount}</b> was placed on your item "${itemTitle}".</p>
            <p>You can contact the bidder at: ${bidderEmail}</p>
            <br/>
            <p>Thank you,<br/>The Campus Marketplace Team</p>
        `,
    });

    // Update emailSent flag
    await Notification.updateOne(
        { userId: sellerId, type: "BID_RECEIVED", "metadata.bidId": bidId },
        { emailSent: true }
    );

    console.log(
        `Bid notification sent to ${sellerEmail}. Message ID: %s`,
        mailInfo.messageId
    );
}

async function handleItemSold(eventPayload) {
    const { item, winningBid, sellerEmail, winnerEmail, sellerId, winnerId } =
        eventPayload;
    if (!winningBid) {
        console.log(`No bids for sold item ${item.id}, no notification sent.`);
        return;
    }

    // Create notification for seller
    await Notification.create({
        userId: sellerId,
        type: "ITEM_SOLD",
        title: `Your item "${item.title}" has been sold`,
        message: `Congratulations! Your item was sold for ₹${winningBid.amount}.`,
        metadata: {
            itemId: item.id,
            itemTitle: item.title,
            bidId: winningBid.id,
            bidAmount: winningBid.amount,
            otherUserEmail: winnerEmail,
        },
        emailSent: false,
    });

    // Create notification for winner
    await Notification.create({
        userId: winnerId,
        type: "BID_WON",
        title: `You won the bid for "${item.title}"`,
        message: `Congratulations! You are the winning bidder with a bid of ₹${winningBid.amount}.`,
        metadata: {
            itemId: item.id,
            itemTitle: item.title,
            bidId: winningBid.id,
            bidAmount: winningBid.amount,
            otherUserEmail: sellerEmail,
        },
        emailSent: false,
    });

    // Check seller email preferences
    const sellerPreferences = await getEmailPreferences(sellerId);
    if (sellerPreferences.itemSold) {
        const sellerMailInfo = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: sellerEmail,
            subject: `Congratulations! Your item "${item.title}" has been sold.`,
            html: `
                <b>Congratulations!</b><br/>
                <p>Your item, "${item.title}", has been sold for <b>₹${winningBid.amount}</b>.</p>
                <p>Please contact the buyer to arrange the exchange. Their email is: ${winnerEmail}</p>
                <br/>
                <p>Thank you,<br/>The Campus Marketplace Team</p>
            `,
        });
        await Notification.updateOne(
            { userId: sellerId, type: "ITEM_SOLD", "metadata.itemId": item.id },
            { emailSent: true }
        );
        console.log(
            `ItemSold notification sent to seller. Message ID: %s`,
            sellerMailInfo.messageId
        );
    } else {
        console.log(
            `Seller ${sellerId} has disabled item sold notifications. Skipping email.`
        );
        await Notification.updateOne(
            { userId: sellerId, type: "ITEM_SOLD", "metadata.itemId": item.id },
            { emailSent: true }
        );
    }

    // Check winner email preferences
    const winnerPreferences = await getEmailPreferences(winnerId);
    if (winnerPreferences.bidWon) {
        const winnerMailInfo = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: winnerEmail,
            subject: `Congratulations! You won the bid for "${item.title}".`,
            html: `
                <b>Congratulations!</b><br/>
                <p>You are the winning bidder for the item "${item.title}" with a bid of <b>₹${winningBid.amount}</b>.</p>
                <p>Please contact the seller to arrange the exchange. Their email is: ${sellerEmail}</p>
                <br/>
                <p>Thank you,<br/>The Campus Marketplace Team</p>
            `,
        });
        await Notification.updateOne(
            { userId: winnerId, type: "BID_WON", "metadata.itemId": item.id },
            { emailSent: true }
        );
        console.log(
            `ItemSold notification sent to winner. Message ID: %s`,
            winnerMailInfo.messageId
        );
    } else {
        console.log(
            `Winner ${winnerId} has disabled bid won notifications. Skipping email.`
        );
        await Notification.updateOne(
            { userId: winnerId, type: "BID_WON", "metadata.itemId": item.id },
            { emailSent: true }
        );
    }
}

// Create a wrapper function to handle startup retries
const startConsumer = () => {
    run().catch((err) => {
        console.error(
            "Kafka Consumer failed to start. Retrying in 5 seconds...",
            err
        );
        setTimeout(startConsumer, 5000);
    });
};

module.exports = { startConsumer };
