const db = require('../../db');
const fs = require('fs');
const path = require('path');

async function seedTicketPermissions() {
    try {
        // 1. Create Tables
        console.log('Creating Ticket System Tables...');
        const schemaPath = path.join(__dirname, 'schema_tickets.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await db.query(schema);
        console.log('Tables created successfully.');

        // 2. Seed Permissions
        const permissions = [
            { slug: 'ticket.create', description: 'Can create support tickets' },
            { slug: 'ticket.view_own', description: 'Can view own support tickets' },
            { slug: 'ticket.manage', description: 'Can manage all support tickets (Admin)' }
        ];

        console.log('Seeding Ticket Permissions...');

        for (const perm of permissions) {
            await db.query(
                'INSERT INTO permissions (slug, description) VALUES ($1, $2) ON CONFLICT (slug) DO NOTHING',
                [perm.slug, perm.description]
            );
        }

        // 3. Assign ticket.manage to the 'Administrator' role
        const adminRole = await db.query('SELECT id FROM admin_roles WHERE name = $1', ['Administrator']);
        if (adminRole.rows.length > 0) {
            const ticketManagePerm = await db.query('SELECT id FROM permissions WHERE slug = $1', ['ticket.manage']);
            if (ticketManagePerm.rows.length > 0) {
                await db.query(
                    'INSERT INTO admin_role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [adminRole.rows[0].id, ticketManagePerm.rows[0].id]
                );
                console.log('Assigned ticket.manage to Administrator role.');
            }
        }

        // 4. Assign to Super Admin Group (if it exists)
        const superAdminGroup = await db.query('SELECT id FROM admin_groups WHERE name = $1', ['Super Admin']);
        if (superAdminGroup.rows.length > 0) {
            const allPerms = await db.query('SELECT id FROM permissions');
            for (const p of allPerms.rows) {
                await db.query(
                    'INSERT INTO admin_group_permissions (group_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [superAdminGroup.rows[0].id, p.id]
                );
            }
            console.log('Assigned all permissions to Super Admin group.');
        }

        console.log('Ticket System initialization complete.');
        process.exit(0);
    } catch (err) {
        console.error('Error during initialization:', err);
        process.exit(1);
    }
}

seedTicketPermissions();
