const db = require('../db');

const checkMessageAccess = async (req, res, next) => {
    // Expected task_id to be passed in params or query depending on route design.
    // For now we assume req.params.taskId or req.query.taskId or req.body.taskId
    const taskId = req.params.taskId || req.query.taskId || req.body.task_id || req.body.taskId;

    if (!taskId) {
        return res.status(400).json({ message: 'Task ID is required for messaging' });
    }

    try {
        const result = await db.query('SELECT client_id, selected_freelancer_id, status FROM jobs WHERE id = $1', [taskId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const job = result.rows[0];

        // Ensure messaging is only open when the job is in progress
        if (job.status !== 'in_progress') {
            return res.status(403).json({ message: 'Messaging is only allowed when the job is in progress.' });
        }

        // Ensure user is either the client or the selected freelancer
        if (req.user.id !== job.client_id && req.user.id !== job.selected_freelancer_id) {
            return res.status(403).json({ message: 'You do not have permission to message in this task.' });
        }

        // User is authorized
        next();
    } catch (err) {
        console.error('Message access check error:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = {
    checkMessageAccess
};
