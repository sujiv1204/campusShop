const { Kafka } = require("kafkajs");
const axios = require("axios");
const nodemailer = require("nodemailer");
require("dotenv").config();

// --- 1. Create an internal in-memory queue ---
const emailQueue = [];

const kafka = new Kafka({
    clientId: "notifications-service",
    brokers: [process.env.KAFKA_BROKER],
    retry: { initialRetryTime: 300, retries: 10 },
});

const consumer = kafka.consumer({
    groupId: "notifications-group",
});
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

// --- 2. Create a separate "worker" to send emails ---
// This worker pulls jobs from the internal queue
const processEmailQueue = async () => {
    if (emailQueue.length === 0) {
        return; // Nothing to do
    }

    // Get the next email job
    const job = emailQueue.shift();

    try {
        console.log(`Worker is sending email for topic: ${job.topic}`);
        if (job.topic === "bids-topic") {
            await handleBidPlaced(job.payload);
        }
        if (
            job.topic === "items-topic" &&
            job.payload.eventType === "ItemSold"
        ) {
            await handleItemSold(job.payload.payload);
        }
    } catch (error) {
        console.error("Email worker failed:", error.message);
        // We could add retry logic here, like pushing the job back onto the queue
    }
};

// --- 3. The Main Consumer Logic ---
const run = async () => {
    await setupMailer();

    // Start the email worker loop (runs every 5 seconds)
    setInterval(processEmailQueue, 5000);

    // ... (consumer.on event listeners) ...

    await consumer.connect();
    await consumer.subscribe({ topic: "bids-topic", fromBeginning: true });
    await consumer.subscribe({ topic: "items-topic", fromBeginning: true });
    console.log("Notifications service is listening for events...");

    await consumer.run({
        eachMessage: async ({ topic, message }) => {
            const event = JSON.parse(message.value.toString());

            // --- 4. THIS IS THE KEY FIX ---
            // The consumer's *only* job is to add the event to the
            // internal queue. This is an extremely fast operation.
            // It does NOT wait for the email to be sent.
            console.log(`Queueing new event from topic: ${topic}`);
            emailQueue.push({ topic, payload: event });

            // Because this function finishes almost instantly,
            // Kafka will commit the offset and *will not* re-deliver the message.
        },
    });
};

// --- (handleBidPlaced and handleItemSold functions) ---
// These are now called by the *worker*, not the consumer.
// They are exactly as you had them in the "fat event" model.

async function handleBidPlaced(event) {
    try {
        const { sellerEmail, bidderEmail, itemTitle, bidAmount } = event;
        const mailInfo = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: sellerEmail,
            subject: `New Bid on Your Item: "${itemTitle}"`,
            html: `<b>Hello!</b><br/>A new bid of <b>₹${bidAmount}</b> was placed on your item "${itemTitle}".<br/><br/>You can contact the bidder at: ${bidderEmail}`,
        });
        console.log(
            `Bid notification email sent to ${sellerEmail}. Message ID: %s`,
            mailInfo.messageId
        );
    } catch (error) {
        console.error(
            "Failed to process BidPlaced notification:",
            error.message
        );
    }
}

async function handleItemSold(eventPayload) {
    try {
        const { item, winningBid, sellerEmail, winnerEmail } = eventPayload;

        if (!winningBid) {
            console.log(
                `No bids found for sold item ${item.id}, no notification sent.`
            );
            return;
        }

        // 3. Email the seller (fast)
        const sellerMailInfo = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: sellerEmail,
            subject: `Congratulations! Your item "${item.title}" has been sold.`,
            html: `<b>Congratulations!</b><br/>...Your item has been sold for <b>₹${winningBid.amount}</b>...`,
        });
        console.log(
            `ItemSold notification sent to seller. Message ID: %s`,
            sellerMailInfo.messageId
        );

        // 4. Email the winning bidder (fast)
        const winnerMailInfo = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: winnerEmail,
            subject: `Congratulations! You won the bid for "${item.title}".`,
            html: `<b>Congratulations!</b><br/>You won the bid for <b>₹${winningBid.amount}</b>...`,
        });
        console.log(
            `ItemSold notification sent to winner. Message ID: %s`,
            winnerMailInfo.messageId
        );
    } catch (error) {
        console.error(
            "Failed to process ItemSold notification:",
            error.message
        );
    }
}

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
