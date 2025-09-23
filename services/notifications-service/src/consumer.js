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
    let testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });
}

// --- Main Consumer Logic ---
const run = async () => {
    await setupMailer();
    await consumer.connect();
    await consumer.subscribe({ topic: "bids-topic", fromBeginning: true });
    console.log("Notifications service is listening for bids...");

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log("Received new bid event!");
            const event = JSON.parse(message.value.toString());

            try {
                // 1. Get item details to find the seller's ID
                const itemResponse = await axios.get(
                    `${process.env.ITEMS_SERVICE_URL}/api/items/${event.itemId}`
                );
                const item = itemResponse.data;
                const sellerId = item.sellerId;

                // 2. Get the seller's and bidder's details from the auth service
                const sellerResponse = await axios.get(
                    `${process.env.AUTH_SERVICE_URL}/api/auth/user/${sellerId}`
                );
                const bidderResponse = await axios.get(
                    `${process.env.AUTH_SERVICE_URL}/api/auth/user/${event.bidderId}`
                );

                const sellerEmail = sellerResponse.data.email;
                const bidderEmail = bidderResponse.data.email;

                // 3. Construct and send the email
                const mailInfo = await transporter.sendMail({
                    from: '"Campus Marketplace" <noreply@campus-marketplace.com>',
                    to: sellerEmail,
                    subject: `New Bid on Your Item: "${item.title}"`,
                    html: `<b>Hello!</b><br/>A new bid of <b>₹${event.amount}</b> was placed on your item "${item.title}".<br/><br/>You can contact the bidder at: ${bidderEmail}`,
                });

                console.log(
                    `Notification email sent to ${sellerEmail}. Preview URL: %s`,
                    nodemailer.getTestMessageUrl(mailInfo)
                );
            } catch (error) {
                console.error(
                    "Failed to process notification:",
                    error.response ? error.response.data : error.message
                );
            }
        },
    });
};

module.exports = { run };
