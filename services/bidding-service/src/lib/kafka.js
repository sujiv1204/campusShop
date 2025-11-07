const { Kafka } = require("kafkajs");
require("dotenv").config();

const kafka = new Kafka({
    clientId: "bidding-service",
    brokers: [process.env.KAFKA_BROKER],
    retry: {
        // Add Kafka-native retries
        initialRetryTime: 300,
        retries: 10,
    },
});

const producer = kafka.producer();

// 1. Connect the producer when the application starts
const connectProducer = async () => {
    try {
        await producer.connect();
        console.log("Bidding Service Kafka Producer connected successfully.");
    } catch (err) {
        console.error(
            "Failed to connect Kafka Producer. Retrying in 5 seconds...",
            err
        );
        setTimeout(connectProducer, 5000); // Retry connection
    }
};

// Handle producer disconnects (e.g., if Kafka restarts)
producer.on(producer.events.DISCONNECT, (err) => {
    console.error(
        "Kafka Producer disconnected. Attempting to reconnect...",
        err
    );
    connectProducer();
});

// This function should just send.
const publishEvent = async (topic, payload) => {
    try {
        await producer.send({
            topic: topic,
            messages: [{ value: JSON.stringify(payload) }],
        });
        console.log(`Event published to ${topic}.`);
    } catch (err) {
        console.error(`Failed to publish event to ${topic}`, err);
        throw err; // Re-throw the error so the poller knows it failed
    }
    // NO producer.disconnect() HERE
};

// 2. The publish function now only sends
const publishBidPlacedEvent = async (bid) => {
    try {
        await producer.send({
            topic: "bids-topic",
            messages: [
                {
                    value: JSON.stringify({
                        bidId: bid.id,
                        itemId: bid.itemId,
                        bidderId: bid.bidderId,
                        amount: bid.amount,
                        createdAt: bid.createdAt,
                    }),
                },
            ],
        });
        console.log("BidPlaced event published successfully.");
    } catch (error) {
        console.error("Error publishing BidPlaced event:", error);
        // In a production system, you might add this to a retry queue
    }
    // 3. Do NOT disconnect here
};

module.exports = {
    publishBidPlacedEvent,
    publishEvent,
    producer,
    connectProducer, // Export connect function to be called in index.js
};
