import http from 'k6/http';
import { check, sleep } from 'k6';

// Test configuration
export const options = {
    stages: [
        { duration: '30s', target: 10 }, // Ramp-up: 10 users over 30s
        { duration: '1m', target: 100 },  // Plateau: Scale to 20 users
        { duration: '20s', target: 0 },  // Ramp-down
    ],
    thresholds: {
        http_req_duration: ['p(95)<200'], // 95% of requests must be under 200ms (Cache test)
        http_req_failed: ['rate<0.01'],    // Less than 1% failure rate
    },
};

const BASE_URL = __ENV.API_URL || 'http://backend:3000';

// The setup phase runs ONCE at the very beginning
export function setup() {
    const loginPayload = JSON.stringify({
        username: 'admin',
        password: 'password123',
    });
    const loginParams = { headers: { 'Content-Type': 'application/json' } };

    let loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, loginParams);

    // Ensure the admin user exists
    if (loginRes.status !== 200) {
        http.post(`${BASE_URL}/auth/signup`, loginPayload, loginParams);
        loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, loginParams);
    }

    if (loginRes.status !== 200) {
        throw new Error('Load test failed: Could not login as admin');
    }

    // Return the token to be used by all concurrent users
    return { token: loginRes.json('token') };
}

// The default function runs REPEATEDLY for every virtual user
export default function (data) {
    const authHeaders = {
        headers: {
            Authorization: `Bearer ${data.token}`,
            'Content-Type': 'application/json',
        },
    };

    // 1. Fetch My Items (Hits Redis!)
    // Now returns { items, total, page, pages }
    const itemsRes = http.get(`${BASE_URL}/items?page=1&limit=10`, authHeaders);
    check(itemsRes, {
        'get items success': (r) => r.status === 200,
        'has 10 items': (r) => r.json().items && r.json().items.length === 10,
    });

    // 2. Search Items (Now paginated!)
    const searchRes = http.get(`${BASE_URL}/items/search?q=Item&page=1&limit=10`, authHeaders);
    check(searchRes, {
        'search items success': (r) => r.status === 200,
        'search has 10 items': (r) => r.json().items && r.json().items.length === 10,
    });

    // Pacing: Wait 1 second between requests per user
    sleep(1);
}
