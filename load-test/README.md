# Project-Mina Load Testing

This directory contains performance testing scripts using [k6](https://k6.io/). These scripts allow you to stress-test your application's write performance (seeding) and read performance (caching).

## Prerequisites

- Docker installed and running.
- Project-Mina services running (`docker-compose up -d`).

## Operations

### 1. Write Operation (Data Seeding)
Use this script to populate your database with a large volume of data (10,000 items) to test how your system handles high-concurrency writes and cache invalidations.

**Command:**
```bash
docker run --rm -i --network project-mina_mina-network grafana/k6 run - <load-test/seed-items.js
```

**What it does:**
- Authenticates once using the `admin` account.
- Creates **10,000 items** using 100 parallel virtual users.
- Forces MySQL to handle a heavy write load and Redis to manage constant cache updates.

---

### 2. Read Operation (Performance Testing)
Use this script to measure the latency and stability of your application while serving a large dataset. This is primarily a test of your **Redis Caching Layer**.

**Command:**
```bash
docker run --rm -i --network project-mina_mina-network grafana/k6 run - <load-test/k6-script.js
```

**What it does:**
- Simulates **20 concurrent users** browsing and searching items.
- Fetches the 10,000 items from the Redis cache.
- Measures the response time (`http_req_duration`) to ensure it stays within professional limits (p95 < 200ms).

---

## Technical Details

### Connectivity
Since the services are running inside a Docker network, k6 must run on the same network (`project-mina_mina-network`) to communicate with the internal `backend:3000` address.

### Metrics to Watch
- **`http_req_duration`**: Average and p(95) response times. For cached reads, this should be extremely low.
- **`http_req_failed`**: Should remain at 0.00%.
- **`iterations`**: The number of complete "user cycles" performed during the test.
