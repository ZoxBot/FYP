const db = require('../db');

let io;

const setIo = (socketIo) => {
    io = socketIo;
};
 
const getIo = () => io;

const createNotification = async (userId, type, data) => {
    try {
        // 1. Fetch user's notification settings
        const userRes = await db.query('SELECT notification_settings FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length === 0) return;

        const settings = userRes.rows[0].notification_settings || {};

        // 2. Check if the specific notification type is enabled on the platform
        if (settings.platform_notifications === false) return;

        // Mapping types to settings:
        // new_bid -> bid_alerts
        // bid_accepted -> bid_alerts
        // new_message -> message_alerts

        let shouldNotify = true;
        if (type === 'new_bid' || type === 'bid_accepted' || type === 'bid_rejected') {
            shouldNotify = settings.bid_alerts !== false;
        } else if (type === 'new_message') {
            shouldNotify = settings.message_alerts !== false;
        }

        if (!shouldNotify) return;

        // 3. Insert into database
        const result = await db.query(
            'INSERT INTO notifications (user_id, type, data) VALUES ($1, $2, $3) RETURNING *',
            [userId, type, data]
        );

        const notification = result.rows[0];

        // 4. Emit via Socket.io if available
        if (io) {
            io.to(`user_${userId}`).emit('notification', notification);
        }

        return notification;
    } catch (err) {
        console.error('Error creating notification:', err);
    }
};

module.exports = {
    setIo,
    getIo,
    createNotification
};
