require("dotenv").config();

module.exports = {
    development: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME, // This will be 'items_db' from your .env
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: "postgres",
        replication: {
            read: [
                {
                    host: process.env.DB_REPLICA_HOST || process.env.DB_HOST,
                    username: process.env.DB_USER,
                    password: process.env.DB_PASSWORD,
                    database: process.env.DB_NAME,
                    port: process.env.DB_PORT
                }
            ],
            write: {
                host: process.env.DB_HOST,
                username: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                port: process.env.DB_PORT
            }
        }
    },
};
