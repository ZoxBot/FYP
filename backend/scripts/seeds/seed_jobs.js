const db = require('../../db');
const bcrypt = require('bcryptjs');

async function seedJobs() {
    try {
        console.log('Seeding jobs...');

        // 1. Create a Client User
        const clientEmail = 'client@example.com';
        let clientId;

        const userRes = await db.query('SELECT id FROM users WHERE email = $1', [clientEmail]);

        if (userRes.rows.length > 0) {
            clientId = userRes.rows[0].id;
            console.log('Client user found:', clientId);
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('clientpassword', salt);

            const newUser = await db.query(
                "INSERT INTO users (first_name, last_name, email, password_hash, role, is_verified) VALUES ('Test', 'Client', $1, $2, 'client', true) RETURNING id",
                [clientEmail, hashedPassword]
            );
            clientId = newUser.rows[0].id;
            console.log('Created client user:', clientId);
        }

        // 2. Insert dummy jobs
        const jobs = [
            { title: 'Build a React Website', description: 'Need a portfolio site.', budget: 500, status: 'pending' },
            { title: 'Logo Design', description: 'Minimalist logo for tech startup.', budget: 100, status: 'active' },
            { title: 'Mobile App MVP', description: 'Flutter app for food delivery.', budget: 1500, status: 'pending' },
            { title: 'SEO Optimization', description: 'Rank my blog higher.', budget: 300, status: 'rejected' }
        ];

        for (const job of jobs) {
            await db.query(
                'INSERT INTO jobs (client_id, title, description, budget, status) VALUES ($1, $2, $3, $4, $5)',
                [clientId, job.title, job.description, job.budget, job.status]
            );
        }

        console.log('Jobs seeded successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

seedJobs();
