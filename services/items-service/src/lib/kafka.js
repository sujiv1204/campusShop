const { Kafka } = require("kafkajs");
require("dotenv").config();

const kafka = new Kafka({
    clientId: "items-service",
    brokers: [process.env.KAFKA_BROKER],
});
const producer = kafka.producer();

const publishItemSoldEvent = async (item) => {
    try {
        await producer.connect();
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
    } finally {
        await producer.disconnect();
    }
};

module.exports = { publishItemSoldEvent };
