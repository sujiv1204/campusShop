const { Kafka } = require("kafkajs");
const nodemailer = require("nodemailer");
require("dotenv").config();
const db = require("./models"); // Import the database
const ProcessedEvent = db.ProcessedEvent; // Import the model

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
    const { sellerEmail, bidderEmail, itemTitle, bidAmount } = event;
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
    console.log(
        `Bid notification sent to ${sellerEmail}. Message ID: %s`,
        mailInfo.messageId
    );
}

async function handleItemSold(eventPayload) {
    const { item, winningBid, sellerEmail, winnerEmail } = eventPayload;
    if (!winningBid) {
        console.log(`No bids for sold item ${item.id}, no notification sent.`);
        return;
    }
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
    console.log(
        `ItemSold notification sent to seller. Message ID: %s`,
        sellerMailInfo.messageId
    );

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
    console.log(
        `ItemSold notification sent to winner. Message ID: %s`,
        winnerMailInfo.messageId
    );
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
