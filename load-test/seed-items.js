import http from 'k6/http';
import { check } from 'k6';
import exec from 'k6/execution';

export const options = {
    vus: 100,           // Corrected to lowercase 'u'
    iterations: 10000,
};

const BASE_URL = __ENV.API_URL || 'http://backend:3000';

// setup() runs once at the start of the test
export function setup() {
    const loginPayload = JSON.stringify({
        username: 'admin',
        password: 'password123',
    });
    const loginParams = { headers: { 'Content-Type': 'application/json' } };

    let loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, loginParams);

    // Attempt signup if login fails
    if (loginRes.status !== 200) {
        console.log('Admin user not found, signing up...');
        http.post(`${BASE_URL}/auth/signup`, loginPayload, loginParams);
        loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, loginParams);
    }

    if (loginRes.status !== 200) {
        throw new Error(`Setup failed: Unable to login as admin. Status: ${loginRes.status}`);
    }

    return { token: loginRes.json('token') };
}

export default function (data) {
    const payload = JSON.stringify({
        title: `Item ${exec.scenario.iterationInTest + 1}`,
        description: `High-volume test item #${exec.scenario.iterationInTest + 1}.`,
    });

    const params = {
        headers: {
            Authorization: `Bearer ${data.token}`,
            'Content-Type': 'application/json',
        },
    };

    const res = http.post(`${BASE_URL}/items`, payload, params);

    check(res, {
        'item created': (r) => r.status === 201,
    });
}
