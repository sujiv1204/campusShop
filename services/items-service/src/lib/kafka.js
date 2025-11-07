const { Kafka } = require("kafkajs");
require("dotenv").config();

const kafka = new Kafka({
    clientId: "items-service",
    brokers: [process.env.KAFKA_BROKER],
    retry: {
        initialRetryTime: 300,
        retries: 10,
    },
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

const publishItemSoldEvent = async (item) => {
    try {
        await producer.send({
            topic: "items-topic",
            messages: [
                {
                    value: JSON.stringify({
                        eventType: "ItemSold",
                        payload: item,
                    }),
                },
            ],
        });
        console.log("ItemSold event published.");
    } catch (error) {
        console.error("Error publishing ItemSold event:", error);
    }
};

module.exports = {
    publishItemSoldEvent,
    connectProducer, // Export connect function
};
