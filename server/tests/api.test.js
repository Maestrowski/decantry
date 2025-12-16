const request = require('supertest');
const app = require('../index');

describe('API Endpoints', () => {
    it('GET /api/health should return 200 and status ok', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ status: 'ok', message: 'Decantry API is running' });
    });

    it('GET /api/nonexistent should likely return 404 (if configured) or just HTML', async () => {
        const res = await request(app).get('/api/somenonexistentpath');
        expect(res.statusCode).not.toEqual(500); // Just ensuring it doesn't crash
    });
});
