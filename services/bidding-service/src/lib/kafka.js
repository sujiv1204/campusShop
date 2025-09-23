const { Kafka } = require("kafkajs");
require("dotenv").config();

const kafka = new Kafka({
    clientId: "bidding-service",
    brokers: [process.env.KAFKA_BROKER], // e.g., 'kafka:29092'
});

const producer = kafka.producer();

// Function to publish the event
const publishBidPlacedEvent = async (bid) => {
    try {
        await producer.connect();
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
    } finally {
        // Disconnecting the producer is often done on application shutdown,
        // but for simplicity, we can do it here. For high-throughput, you'd manage this differently.
        await producer.disconnect();
    }
};

module.exports = { publishBidPlacedEvent };
