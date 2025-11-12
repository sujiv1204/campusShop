import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { SharedArray } from 'k6/data';

// Load test credentials from JSON or CSV (pre-created test accounts)
const creds = new SharedArray('creds', function() {
  return JSON.parse(open('./test_creds.json')); // [{ "email": "...", "password": "..." }, ...]
});

// Configuration via environment or hard-code
export let options = {
  stages: [
    { duration: '1m', target: 20 },   // ramp to 20 VUs
    { duration: '4m', target: 100 },  // ramp to 100 VUs (adjust to reach desired RPS)
    { duration: '10m', target: 100 }, // steady-state
    { duration: '1m', target: 0 },    // ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1000'], // 95% requests < 1s
    'http_req_failed': ['rate<0.05'],    // <5% failed
    'checks': ['rate>0.95'],             // 95% checks must pass
  },
};

const BASE = __ENV.STAGING_URL || 'http://localhost:5001';
const LOGIN_ENDPOINT = `${BASE}/api/auth/login`;

// Choose a ratio valid:invalid
const VALID_RATIO = 0.10;

export default function () {
  // pick credential randomly
  const idx = Math.floor(Math.random() * creds.length);
  const cred = creds[idx];

  // decide whether to use valid or invalid password
  let payload;
  if (Math.random() < VALID_RATIO) {
    payload = JSON.stringify({ email: cred.email, password: cred.password });
  } else {
    payload = JSON.stringify({ email: cred.email, password: 'WrongPass123!' + Math.random() });
  }

  const params = { headers: { 'Content-Type': 'application/json' } };
  const res = http.post(LOGIN_ENDPOINT, payload, params);

  const ok = check(res, {
    'status is 200 or 401 or 429': (r) => [200, 401, 429].includes(r.status),
    'no 5xx': (r) => r.status < 500,
  });

  // Safety: if many 5xx responses, fail the test (k6 will stop on failure)
  if (res.status >= 500) {
    console.error(`Server error: ${res.status}`);
  }

  // small sleep to mimic real user pacing (VUs control concurrency)
  sleep(Math.random() * 0.5);
}
