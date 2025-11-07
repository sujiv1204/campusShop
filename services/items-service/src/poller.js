const db = require("./models");
const { publishEvent } = require("./lib/kafka");
const EventOutbox = db.EventOutbox;

const POLLING_INTERVAL = 5000; // 5 seconds

const processOutbox = async () => {
    let events = [];
    try {
        events = await EventOutbox.findAll({
            where: { status: "pending" },
            limit: 10,
        });

        if (events.length === 0) return;

        console.log(`Found ${events.length} pending events to publish...`);

        for (const event of events) {
            // 1. Publish the event
            await publishEvent(event.topic, event.payload);

            // 2. Mark as 'sent'
            event.status = "sent";
            await event.save();
        }
    } catch (err) {
        console.error(
            "Error processing items-service outbox. Kafka might be down.",
            err.message
        );
    }
};

const startPolling = () => {
    // Start polling after a delay
    setTimeout(() => {
        setInterval(processOutbox, POLLING_INTERVAL);
        console.log("Items Service Outbox poller started.");
    }, 5000);
};

module.exports = { startPolling };
