const { Kafka } = require("kafkajs");
require("dotenv").config();

const kafka = new Kafka({
    clientId: "notifications-service",
    brokers: [process.env.KAFKA_BROKER],
});

const consumer = kafka.consumer({ groupId: "notifications-group" });

const run = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: "bids-topic", fromBeginning: true });
    console.log("Notifications service is listening for bids...");

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log("Received new bid event!");
            const event = JSON.parse(message.value.toString());
            console.log(event);

            // We will add the logic to call other services and send an email here
        },
    });
};

module.exports = { run };
