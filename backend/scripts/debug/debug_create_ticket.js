
async function testTicketCreation() {
    try {
        // 1. Login
        console.log("Logging in as superadmin...");
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
        console.log("Logged in. Token received.");

        // 2. Create Ticket
        console.log("Attempting POST /api/tickets...");
        const res = await fetch('http://localhost:5000/api/tickets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                subject: "Test Ticket from Debug Script",
                category: "bug",
                description: "This is a test ticket to verify ticket.create permission."
            })
        });

        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Response:", data);

    } catch (err) {
        console.error("Error:", err);
    }
}

testTicketCreation();
