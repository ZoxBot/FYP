
const crypto = require('crypto');

async function testPermissions(role) {
    const email = `test_${role}_${Date.now()}@example.com`;
    const password = 'password123';

    console.log(`\nTesting Role: ${role}`);

    try {
        // 1. Signup
        const signupRes = await fetch('http://localhost:5000/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                first_name: 'Test',
                last_name: 'User',
                email,
                password,
                role
            })
        });

        if (!signupRes.ok) {
            console.error("Signup failed:", await signupRes.text());
            return;
        }

        const signupData = await signupRes.json();
        const token = signupData.token;
        console.log("Registered & Logged in. Token:", token ? "YES" : "NO");

        // 2. Delete Avatar
        const delRes = await fetch('http://localhost:5000/api/users/avatar', {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`DELETE Status: ${delRes.status}`);
        const delData = await delRes.json();
        console.log("Response:", delData);

    } catch (e) {
        console.error("Error:", e);
    }
}

async function run() {
    await testPermissions('client'); // Matches 'Client' role logic?
    await testPermissions('freelancer');
    await testPermissions('admin');
}

run();
