const jwt = require('jsonwebtoken');
const http = require('http');
require('dotenv').config({ path: './.env' });

async function testApi() {
    const secret = process.env.JWT_SECRET || 'kaamko_kura_secret_key_2024';
    // User ID 11 is superadmin@kaamkokura.com
    const token = jwt.sign({ id: 11, email: 'superadmin@kaamkokura.com', role: 'admin' }, secret);

    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/admin/roles/1/users',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    console.log("Testing GET /api/admin/roles/1/users...");
    const req = http.request(options, (res) => {
        console.log(`Status: ${res.statusCode}`);
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            console.log("Response Body:", data);
            try {
                const parsed = JSON.parse(data);
                console.log("Parsed Data Length:", Array.isArray(parsed) ? parsed.length : 'Not an array');
            } catch (e) {
                console.log("Failed to parse JSON response");
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
    });

    req.end();
}

testApi();
