const db = require('../../db');

async function check() {
    try {
        const res = await db.query('SELECT id, subject, status, is_archived FROM tickets');
        console.log('--- Ticket Data ---');
        console.table(res.rows);
        const counts = await db.query('SELECT is_archived, count(*) FROM tickets GROUP BY is_archived');
        console.log('--- Counts ---');
        console.table(counts.rows);
    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        process.exit();
    }
}

check();
