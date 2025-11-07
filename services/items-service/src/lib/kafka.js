const { Kafka } = require("kafkajs");
require("dotenv").config();

const kafka = new Kafka({
    clientId: "items-service",
    brokers: [process.env.KAFKA_BROKER],
    retry: { initialRetryTime: 300, retries: 10 },
});

const producer = kafka.producer();

const connectProducer = async () => {
    try {
        await producer.connect();
        console.log("Items Service Kafka Producer connected successfully.");
    } catch (err) {
        console.error(
            "Failed to connect Kafka Producer. Retrying in 5 seconds...",
            err
        );
        setTimeout(connectProducer, 5000);
    }
};

producer.on(producer.events.DISCONNECT, (err) => {
    console.error(
        "Kafka Producer disconnected. Attempting to reconnect...",
        err
    );
    connectProducer();
});

const publishEvent = async (topic, payload) => {
    try {
        await producer.send({
            topic: topic,
            messages: [{ value: JSON.stringify(payload) }],
        });
        console.log(`Event published to ${topic}.`);
    } catch (err) {
        console.error(`Failed to publish event to ${topic}`, err);
        throw err; // Re-throw error so the poller knows it failed
    }
};

module.exports = {
    publishEvent,
    connectProducer,
};
