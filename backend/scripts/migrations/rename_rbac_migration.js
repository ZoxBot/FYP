const db = require('../../db');

async function migrateGigToJob() {
    console.log("--- Migrating Usage of 'Gig' to 'Job' in RBAC ---");

    try {
        await db.query('BEGIN');

        // 1. Rename 'marketplace' group to 'jobs'
        // Slug: marketplace -> jobs
        // Desc: Marketplace Moderation Group -> Job Management Group
        await db.query(`
            UPDATE permissions 
            SET slug = 'jobs', description = 'Job Management Group'
            WHERE slug = 'marketplace'
        `);
        console.log("Updated group 'marketplace' -> 'jobs'");

        // 2. Rename Child Permissions (gig.* -> job.*)
        const mappings = [
            { old: 'gig.approve', new: 'job.approve', desc: 'Approve Jobs' },
            { old: 'gig.reject', new: 'job.reject', desc: 'Reject Jobs' },
            { old: 'gig.suspend', new: 'job.suspend', desc: 'Suspend Jobs' },
            { old: 'gig.view', new: 'job.view', desc: 'View Jobs' }
        ];

        for (const map of mappings) {
            await db.query(`
                UPDATE permissions 
                SET slug = $1, description = $2
                WHERE slug = $3
            `, [map.new, map.desc, map.old]);
            console.log(`Updated '${map.old}' -> '${map.new}'`);
        }

        await db.query('COMMIT');
        console.log("✅ Migration Complete.");

    } catch (err) {
        await db.query('ROLLBACK');
        console.error("Migration Failed:", err);
    } finally {
        process.exit();
    }
}

migrateGigToJob();
