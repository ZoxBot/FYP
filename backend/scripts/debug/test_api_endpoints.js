const axios = require('axios');

async function testApi() {
    console.log("--- Testing API Endpoints ---");
    const baseURL = 'http://localhost:5000';

    try {
        // 1. Login
        console.log("Logging in...");
        const loginRes = await axios.post(`${baseURL}/api/auth/login`, {
            email: 'superadmin@kaamkokura.com',
            password: 'SuperAdmin123!'
        });

        const token = loginRes.data.token;
        console.log("Login Successful. Token received.");

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Test Stats
        console.log("\nTesting GET /api/admin/stats...");
        try {
            const statsRes = await axios.get(`${baseURL}/api/admin/stats`, { headers });
            console.log("✅ Stats Status:", statsRes.status);
            console.log("Stats Data:", statsRes.data);
        } catch (e) {
            console.error("❌ Stats Failed:", e.response ? e.response.status : e.message);
        }

        // 3. Test Users
        console.log("\nTesting GET /api/admin/users...");
        try {
            const usersRes = await axios.get(`${baseURL}/api/admin/users`, { headers });
            console.log("✅ Users Status:", usersRes.status);
            console.log(`Users Count: ${usersRes.data.length}`);
            if (usersRes.data.length > 0) {
                console.log("First User:", usersRes.data[0].email);
            }
        } catch (e) {
            console.error("❌ Users Failed:", e.response ? e.response.status : e.message);
            if (e.response) console.log("Response Data:", e.response.data);
        }

    } catch (err) {
        console.error("Critical Test Error:", err.message);
        if (err.response) {
            console.log("Login Response:", err.response.data);
        }
    }
}

testApi();
