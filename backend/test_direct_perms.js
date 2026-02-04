const axios = require('axios');
const db = require('./db');

async function testDirectPerms() {
    console.log("--- Testing Direct Permission Assignment ---");
    const baseURL = 'http://localhost:5000';

    try {
        // 1. Login as Super Admin
        const loginRes = await axios.post(`${baseURL}/api/auth/login`, {
            email: 'superadmin@kaamkokura.com',
            password: 'SuperAdmin123!'
        });
        const token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log("Login Successful.");

        // 2. Identify a Target User (e.g., ID 1)
        const targetUserId = 1;

        // 3. Get Permission ID for 'gig.approve' (ID ~13 usually, but let's fetch)
        const permRes = await db.query("SELECT id FROM permissions WHERE slug = 'gig.approve'");
        if (permRes.rows.length === 0) throw new Error("Permission not found");
        const permId = permRes.rows[0].id;
        console.log(`Testing with permission: gig.approve (ID: ${permId})`);

        // 4. Assign Direct Permission via API
        console.log("Assigning direct permission...");
        const putRes = await axios.put(
            `${baseURL}/api/admin/users/${targetUserId}/permissions`,
            { permissionIds: [permId] },
            { headers }
        );
        console.log("PUT Response:", putRes.status);

        // 5. Verify via DB
        const checkRes = await db.query(
            "SELECT * FROM admin_user_permissions WHERE user_id = $1 AND permission_id = $2",
            [targetUserId, permId]
        );
        if (checkRes.rows.length > 0) {
            console.log("✅ Direct Permission Verified in DB.");
        } else {
            console.error("❌ Direct Permission NOT found in DB.");
        }

        // 6. Verify via 'GET Details' API
        const detailRes = await axios.get(`${baseURL}/api/admin/users/${targetUserId}/permissions`, { headers });
        const directPerms = detailRes.data.directPermissions;
        if (directPerms.find(p => p.id === permId)) {
            console.log("✅ API confirms direct permission present.");
        } else {
            console.error("❌ API failed to return direct permission.");
        }

    } catch (err) {
        console.error("Test Failed:", err.message);
        if (err.response) console.error(err.response.data);
    } finally {
        process.exit();
    }
}

testDirectPerms();
