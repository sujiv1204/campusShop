# Campus Shop - Microservices Marketplace

A scalable e-commerce platform built with microservices architecture on Kubernetes.

## Quick Start

```bash
# Install and setup cluster
See INSTALLATION.md

# Run system tests
cd scripts
./test-system.sh --quick          # Quick test (5/10/5)
./test-system.sh --small          # Small test (50/100/50)
./test-system.sh --medium         # Medium test (200/500/200)
./test-system.sh --large          # Large test (500/2000/1000)

# Test specific components
./test-system.sh --auth           # Test auth service only
./test-system.sh --items          # Test items service only
./test-system.sh --bidding        # Test bidding service only
./test-system.sh --db             # Test databases and replicas
./test-system.sh --kafka          # Test Kafka

# Custom log file
./test-system.sh --large --log my-test.log

# Check databases
See DATABASE_GUIDE.md
```

## System Tests

The `test-system.sh` script tests:

-   All 5 microservices (auth, items, bidding, notifications, profile)
-   PostgreSQL read/write replicas
-   Kafka event pipeline
-   MongoDB notifications
-   HPA autoscaling
-   Complete data flow

Results are logged to `test-results.log` (appended, not overwritten).

## Documentation

-   `README.md` - This file (project overview)
-   `TESTING.md` - Complete testing guide
-   `DATABASE_GUIDE.md` - Database inspection commands
-   `INSTALLATION.md` - Kubernetes setup guide
-   `ROADMAP.md` - Development phases

---

## Key Features

-   🔒 Secure user authentication with campus email
-   📦 List, edit, and delete items with image uploads
-   💸 Real-time bidding system for fair item sales
-   📧 Automated email notifications for bids and sales
-   👤 User profile management with item and bid history
-   🏗️ Microservices architecture
-   🖥️ React frontend

---

## Technologies Used

-   **Backend:** Node.js, Express, PostgreSQL, Sequelize
-   **Frontend:** React, Vite, Tailwind CSS
-   **Infrastructure:** Docker, Docker Compose, Nginx, MinIO, Apache Kafka
-   **Other:** JWT, Multer, Nodemailer

---

## Prerequisites

-   [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
-   [Node.js](https://nodejs.org/) (v18 or higher) and [npm](https://www.npmjs.com/) (for frontend development)

---

## System Flow

-   Users interact with the React frontend, which communicates with backend services via an Nginx API gateway.
-   Authentication is handled by the Auth Service, which issues JWT tokens for secure access.
-   The Items Service manages item listings, including image uploads to MinIO storage.
-   The Bidding Service allows users to place bids on items and publishes bid events to Kafka.
-   The Profile Service aggregates user data, calling the Items and Bidding services to provide item and bid history, including sold items and bids received.
-   The Notifications Service listens to Kafka events and sends email notifications for important actions like new bids and completed sales.

---

## Infrastructure

-   **Nginx** acts as the API gateway, routing requests to the appropriate backend microservices.
-   **PostgreSQL** databases are used by each service for data persistence.
-   **MinIO** provides S3-compatible object storage for item images.
-   **Kafka** enables asynchronous event-driven communication between services.
-   **Docker Compose** orchestrates all services and dependencies for easy local development and deployment.

---

## Microservices

-   **Auth Service:** Handles user registration, login, and JWT authentication.
-   **Items Service:** Manages CRUD operations for items and image uploads.
-   **Bidding Service:** Handles bid placement, validation, and event publishing.
-   **Profile Service:** Aggregates user item and bid history by calling Items and Bidding services.
-   **Notifications Service:** Consumes Kafka events and sends email notifications.

---

## Installation Instructions

### 1. Clone the repository

```sh
git clone https://github.com/sujiv1204/campusShop.git
cd campusShop
```

### 2. Configure environment variables

-   Copy `.env.example` to `.env` in each service directory under `services/`.
-   Fill in the required values (database URLs, JWT secrets, etc.).

### 3. Start backend and infrastructure services

```sh
docker compose up --build
```

-   This will start all backend microservices, databases, Kafka, MinIO, and the Nginx API gateway.

### 4. Start the frontend development server

In a new terminal:

```sh
cd frontend
npm install
npm run dev
```

-   The frontend will be available at [http://localhost:5173](http://localhost:5173) by default.

---

## Usage

-   **Access the app:**
    -   Frontend: [http://localhost:5173](http://localhost:5173)
    -   API Gateway: [http://localhost/api](http://localhost/api)
    -   MinIO Console: [http://localhost:9001](http://localhost:9001)
-   **Register/Login:** Use your campus email to register and log in.
-   **List Items:** Create, edit, and delete item listings with images.
-   **Bid:** Place bids on available items.
-   **Profile:** View your item and bid history, including items sold and bids received.
-   **Notifications:** Receive emails for bid and sale events.

---

## License

MIT License

---

## Reports

> https://drive.google.com/drive/folders/17bpAYH8ug_BUI-pf57DD9TX2uE5gF3u4?usp=sharing

---

## Acknowledgments

-   Inspired by campus communities and student needs
-   Thanks to all open-source contributors and the Node.js, React, and Docker communities

---
