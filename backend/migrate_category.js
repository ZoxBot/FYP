const db = require('./db');
(async () => {
    try {
        await db.query('ALTER TABLE jobs ADD COLUMN IF NOT EXISTS category VARCHAR(100);');
        console.log('Successfully added category column to jobs table.');
        process.exit(0);
    } catch (err) {
        console.error('Failed to add category column:', err);
        process.exit(1);
    }
})();
