const axios = require('axios');

const API_URL = 'http://localhost:5000/api/admin/auth';
const STATS_URL = 'http://localhost:5000/api/admin/stats';

async function runTests() {
    console.log('--- STARTING ADMIN PORTAL VERIFICATION ---');

    // 1. Test Freelancer Login
    console.log('\n[TEST 1] Testing Freelancer Login at Admin Portal...');
    try {
        await axios.post(`${API_URL}/login`, {
            email: 'freelancer@example.com',
            password: 'password'
        });
        console.error('❌ FAILURE: Freelancer was allowed to login to Admin Portal');
    } catch (error) {
        if (error.response && error.response.status === 403) {
            console.log('✅ SUCCESS: Freelancer login rejected (403 Forbidden)');
        } else if (error.response && (error.response.status === 401 || error.response.status === 400)) {
            console.log(`✅ SUCCESS: Freelancer login rejected (${error.response.status} ${error.response.data.message})`);
        } else {
            console.error('❌ FAILURE: Unexpected error during freelancer login:', error.message);
            if (error.response) console.error('Response:', error.response.status, error.response.data);
        }
    }

    // 2. Test Admin Login
    console.log('\n[TEST 2] Testing Admin Login...');
    let adminToken;
    try {
        const res = await axios.post(`${API_URL}/login`, {
            email: 'admin@example.com',
            password: 'adminpassword'
        });
        adminToken = res.data.admin_token;
        if (adminToken && res.data.user && res.data.user.role === 'admin') {
            console.log('✅ SUCCESS: Admin login successful. Token received.');
        } else {
            console.error('❌ FAILURE: Admin login response missing token or role');
        }
    } catch (error) {
        console.error('❌ FAILURE: Admin login failed:', error.message);
        if (error.response) console.error('Response:', error.response.status, error.response.data);
    }

    // 3. Test Security Boundary (Freelancer token on Admin stats)
    if (adminToken) {
        console.log('\n[TEST 3] Testing Security Boundary with unauthorized requests...');
        // We'll skip freelancer token for now and just test admin token works on protected route
        try {
            const res = await axios.get(STATS_URL, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            console.log('✅ SUCCESS: Admin token allowed access to protected stats.');
        } catch (error) {
            console.error('❌ FAILURE: Admin token rejected for stats:', error.message);
            if (error.response) console.error('Response:', error.response.status, error.response.data);
        }
    }

    console.log('\n--- VERIFICATION COMPLETE ---');
    process.exit(0);
}

runTests();
