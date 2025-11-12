const axios = require("axios");
const { faker } = require("@faker-js/faker");
const { execSync } = require("child_process");

// Configure axios defaults
axios.defaults.headers.common["Content-Type"] = "application/json";
axios.defaults.headers.common["Accept"] = "application/json";

// Configuration
const API_BASE = process.env.API_BASE || "http://localhost:8080/api";
const NUM_USERS =
    parseInt(process.argv[2]) || parseInt(process.env.NUM_USERS) || 10;
const NUM_ITEMS =
    parseInt(process.argv[3]) || parseInt(process.env.NUM_ITEMS) || 50;
const NUM_BIDS =
    parseInt(process.argv[4]) || parseInt(process.env.NUM_BIDS) || 100;
const CONCURRENT_REQUESTS = parseInt(process.env.CONCURRENT_REQUESTS) || 5;

// Categories for realistic items
const CATEGORIES = [
    "Electronics",
    "Books & Media",
    "Furniture",
    "Clothing & Accessories",
    "Sports & Fitness",
    "Home & Kitchen",
    "Toys & Games",
    "Beauty & Personal Care",
    "Musical Instruments",
    "Automotive",
];

console.log("Campus Marketplace Seed Data Generator");
console.log("==========================================");
console.log("API Base:", API_BASE);
console.log(
    "Target:",
    NUM_USERS,
    "users,",
    NUM_ITEMS,
    "items,",
    NUM_BIDS,
    "bids"
);
console.log("Concurrency:", CONCURRENT_REQUESTS, "parallel requests");
console.log("==========================================\n");

// Helper: Run promises with concurrency limit
async function runWithConcurrency(
    items,
    fn,
    concurrency = CONCURRENT_REQUESTS
) {
    const results = [];
    for (let i = 0; i < items.length; i += concurrency) {
        const batch = items.slice(i, i + concurrency);
        const batchResults = await Promise.allSettled(batch.map(fn));
        results.push(...batchResults);
    }
    return results;
}

// Check API health
async function checkHealth() {
    console.log("Checking all services health...\n");

    const services = [
        { name: "Auth Service", endpoint: `${API_BASE}/auth/health` },
        { name: "Items Service", endpoint: `${API_BASE}/items/health` },
        { name: "Bidding Service", endpoint: `${API_BASE}/bids/health` },
        { name: "Profile Service", endpoint: `${API_BASE}/profiles/health` },
        {
            name: "Notifications Service",
            endpoint: `${API_BASE}/notifications/health`,
        },
    ];

    let allHealthy = true;
    const results = [];

    for (const service of services) {
        try {
            await axios.get(service.endpoint);
            console.log(`  ✓ ${service.name}: Healthy`);
            results.push({ service: service.name, status: "healthy" });
        } catch (error) {
            const errorMsg =
                error.code || error.response?.status || "Unknown error";
            console.log(`  ✗ ${service.name}: Failed (${errorMsg})`);
            results.push({
                service: service.name,
                status: "failed",
                error: errorMsg,
            });
            allHealthy = false;
        }
    }

    console.log();

    if (!allHealthy) {
        console.log("⚠️  Warning: Some services are not healthy");
        console.log(
            "   Continuing anyway - operations may fail if services are down\n"
        );
    }

    return true; // Continue anyway - will fail on actual operations if services are down
}

// Create users
async function seedUsers() {
    console.log(`\nCreating ${NUM_USERS} users...`);
    const timestamp = Date.now();

    // Phase 1: Register users
    console.log("  Phase 1/3: Registering users...");
    const userPromises = Array.from({ length: NUM_USERS }, (_, i) => i);

    const registerResults = await runWithConcurrency(
        userPromises,
        async (i) => {
            const email = `testuser${timestamp}${i}@iitj.ac.in`;
            const password = "Test123!";
            const name = faker.person.fullName();

            try {
                await axios.post(`${API_BASE}/auth/register`, {
                    email,
                    password,
                    name,
                });
                if ((i + 1) % 10 === 0) {
                    console.log(`     Registered: ${i + 1}/${NUM_USERS}`);
                }
                return { email, password, name };
            } catch (error) {
                console.log(
                    `     Error registering user ${i + 1}:`,
                    error.response?.data?.message || error.message
                );
                return null;
            }
        }
    );

    // Phase 2: Auto-verify all users
    console.log("  Phase 2/3: Auto-verifying users...");
    try {
        const cmd = `kubectl exec -n campus-shop postgres-auth-0 -- psql -U admin -d auth_db -c "UPDATE \\"Users\\" SET \\"isVerified\\" = true WHERE email LIKE 'testuser${timestamp}%@iitj.ac.in';"`;
        execSync(cmd, { stdio: "pipe" });
        console.log("     All users verified");
    } catch (error) {
        console.log("     Warning: Auto-verification failed");
    }

    // Phase 3: Login all users
    console.log("  Phase 3/3: Logging in users...");
    const loginResults = await runWithConcurrency(
        registerResults,
        async (result) => {
            if (!result.value) return null;

            const { email, password } = result.value;
            try {
                const response = await axios.post(`${API_BASE}/auth/login`, {
                    email,
                    password,
                });
                const token = response.data.token || response.data.data?.token;
                if (!token) {
                    console.log(`     Warning: No token for ${email}`);
                    return null;
                }
                return { email, token };
            } catch (error) {
                console.log(
                    `     Error logging in ${email}:`,
                    error.response?.data?.message || error.message
                );
                return null;
            }
        }
    );

    const successfulLogins = loginResults.filter(
        (r) => r.status === "fulfilled" && r.value !== null
    );
    console.log(
        `  Completed: ${successfulLogins.length}/${NUM_USERS} users created\n`
    );
    return successfulLogins.map((r) => r.value);
}

// Create items
async function seedItems(users) {
    console.log(`Creating ${NUM_ITEMS} items...`);

    if (users.length === 0) {
        console.log("  Error: No users available\n");
        return [];
    }

    const itemPromises = Array.from({ length: NUM_ITEMS }, (_, i) => i);
    const errors = [];

    const results = await runWithConcurrency(itemPromises, async (i) => {
        const user = users[i % users.length];
        const category = CATEGORIES[i % CATEGORIES.length];

        const itemData = {
            title: `${category}: ${faker.commerce.productName()}`,
            description: faker.commerce.productDescription(),
            price: parseFloat(faker.commerce.price({ min: 50, max: 5000 })),
            imageUrl: faker.image.url(),
        };

        try {
            const response = await axios.post(`${API_BASE}/items`, itemData, {
                headers: { Authorization: `Bearer ${user.token}` },
            });
            if ((i + 1) % 50 === 0) {
                console.log(`  Created: ${i + 1}/${NUM_ITEMS}`);
            }
            const item = response.data.data || response.data;
            // Store seller email with item for bid validation
            return { ...item, sellerEmail: user.email };
        } catch (error) {
            const errorMsg =
                error.response?.data?.message ||
                error.response?.data?.error ||
                error.message;
            errors.push({ item: i + 1, error: errorMsg });
            return null;
        }
    });

    const successfulItems = results.filter(
        (r) => r.status === "fulfilled" && r.value !== null
    );

    if (errors.length > 0) {
        console.log(`  Failed items: ${errors.length}`);
        console.log("  First error:", errors[0].error);
    }

    console.log(
        `  Completed: ${successfulItems.length}/${NUM_ITEMS} items created\n`
    );
    return successfulItems.map((r) => r.value);
}

// Place bids
async function seedBids(users, items) {
    console.log(`Placing ${NUM_BIDS} bids...`);

    if (users.length === 0 || items.length === 0) {
        console.log("  Error: Need users and items\n");
        return;
    }

    const bidPromises = Array.from({ length: NUM_BIDS }, (_, i) => i);
    const errors = [];

    const results = await runWithConcurrency(bidPromises, async (i) => {
        // Get a user who is NOT the seller of the item
        const item = items[i % items.length];
        let user = users[i % users.length];

        // If user is the seller, pick a different user
        if (user.email === item.sellerEmail) {
            // Find a different user (not the seller)
            const otherUsers = users.filter(
                (u) => u.email !== item.sellerEmail
            );
            if (otherUsers.length === 0) {
                errors.push({
                    bid: i + 1,
                    itemId: item.id,
                    error: "No other users available to bid",
                });
                return false;
            }
            user = otherUsers[i % otherUsers.length];
        }

        const bidAmount = parseFloat(
            (item.price * (1.1 + Math.random() * 0.4)).toFixed(2)
        );

        try {
            await axios.post(
                `${API_BASE}/bids`,
                { itemId: item.id, amount: bidAmount },
                {
                    headers: { Authorization: `Bearer ${user.token}` },
                }
            );
            if ((i + 1) % 100 === 0) {
                console.log(`  Placed: ${i + 1}/${NUM_BIDS}`);
            }
            return true;
        } catch (error) {
            const errorMsg =
                error.response?.data?.message ||
                error.response?.data?.error ||
                error.message;
            errors.push({ bid: i + 1, itemId: item.id, error: errorMsg });
            return false;
        }
    });

    const successfulBids = results.filter(
        (r) => r.status === "fulfilled" && r.value === true
    ).length;

    if (errors.length > 0) {
        console.log(`  Failed bids: ${errors.length}`);
        console.log("  First error:", errors[0].error);
        if (errors.length > 1) {
            console.log(`  (${errors.length - 1} more errors)`);
        }
    }

    console.log(`  Completed: ${successfulBids}/${NUM_BIDS} bids placed\n`);
}

// Main execution
async function main() {
    try {
        const startTime = Date.now();
        await checkHealth();
        const users = await seedUsers();
        const items = await seedItems(users);
        await seedBids(users, items);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log("==========================================");
        console.log("Seed Data Generation Complete!");
        console.log("==========================================");
        console.log("Duration:", duration, "seconds");
        console.log("Users created:", users.length);
        console.log("Items created:", items.length);
        console.log("\nNext steps:");
        console.log("- Run tests: ./test-system.sh --quick");
        console.log("- Check DBs: See DATABASE_GUIDE.md");
        console.log("==========================================\n");
    } catch (error) {
        console.error("\nError:", error.message);
        process.exit(1);
    }
}

main();
