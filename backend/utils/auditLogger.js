const db = require('../db');

async function logAdminAction(adminId, action, targetType, targetId, details, req) {
    try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await db.query(
            'INSERT INTO audit_logs (admin_id, action, target_type, target_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
            [adminId, action, targetType, targetId, JSON.stringify(details), ip]
        );
    } catch (err) {
        console.error("Audit Logging Error:", err);
    }
}

module.exports = { logAdminAction };
