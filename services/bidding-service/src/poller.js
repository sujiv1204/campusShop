const db = require("./models");
const { publishEvent } = require("./lib/kafka"); // We only need the publish function
const EventOutbox = db.EventOutbox;

const POLLING_INTERVAL = 5000; // 5 seconds

const processOutbox = async () => {
    let events = [];
    try {
        // Find all pending events
        events = await EventOutbox.findAll({
            where: { status: "pending" },
            limit: 10,
        });

        if (events.length === 0) {
            return;
        }

        console.log(`Found ${events.length} pending events to publish...`);

        for (const event of events) {
            // 1. Publish the event
            await publishEvent(event.topic, event.payload);

            // 2. Mark as 'sent' in the database
            event.status = "sent";
            await event.save();
        }
    } catch (err) {
        console.error(
            "Error processing outbox. Kafka might be down.",
            err.message
        );
        // If Kafka is down, 'publishEvent' will throw,
        // 'event.save()' will NOT run, and the events will remain 'pending'.
        // This is the correct behavior for a retry.
    }
};

const startPolling = () => {
    // Start polling *after* an initial delay to let Kafka connect
    setTimeout(() => {
        setInterval(processOutbox, POLLING_INTERVAL);
        console.log("Outbox poller started.");
    }, 5000); // Give 5s for initial connection
};

module.exports = { startPolling };
