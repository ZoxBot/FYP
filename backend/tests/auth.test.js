const request = require('supertest');
const { app, server } = require('../server');
const db = require('../db');

describe('Auth Endpoints', () => {
    afterAll(async () => {
        // Close database connection and server
        await db.end();
        server.close();
    });

    it('should fail login with invalid credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'nonexistent@example.com',
                password: 'wrongpassword'
            });
        
        // It might be 401 or 404 depending on implementation
        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('message');
    });

    it('should handle missing fields in signup', async () => {
        const res = await request(app)
            .post('/api/auth/signup')
            .send({
                email: 'test@example.com'
                // missing password, name, etc.
            });
        
        if (res.statusCode !== 400) {
            console.log('Signup Fail Status:', res.statusCode);
            console.log('Signup Fail Body:', JSON.stringify(res.body, null, 2));
        }
        expect(res.statusCode).toBe(400);
    });
});
