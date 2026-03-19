
async function testRemoval() {
    try {
        // 1. Login
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'superadmin@kaamkokura.com',
                password: 'password123'
            })
        });

        if (!loginRes.ok) {
            console.error("Login failed:", await loginRes.text());
            return;
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log("Logged in. Token:", token ? "YES" : "NO");

        // 2. Remove Avatar
        console.log("Attempting DELETE /api/users/avatar...");
        const res = await fetch('http://localhost:5000/api/users/avatar', {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Data:", data);

    } catch (err) {
        console.error("Error:", err);
    }
}

testRemoval();
