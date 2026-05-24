const request = require('supertest');
const { app, server } = require('../server');
const db = require('../db');

describe('Jobs Pagination and Status Filtering Endpoints', () => {
    afterAll(async () => {
        // Close database connection and server
        await db.end();
        server.close();
    });

    it('should fetch jobs with default limit of 10', async () => {
        const res = await request(app)
            .get('/api/jobs');
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('jobs');
        expect(res.body).toHaveProperty('pagination');
        expect(Array.isArray(res.body.jobs)).toBe(true);
        expect(res.body.jobs.length).toBeLessThanOrEqual(10);
        expect(res.body.pagination.limit).toBe(10);
    });

    it('should respect status filter', async () => {
        const res = await request(app)
            .get('/api/jobs?status=open');
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('jobs');
        res.body.jobs.forEach(job => {
            expect(job.status).toBe('active');
        });
    });
});
