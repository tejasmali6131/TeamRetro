import request from 'supertest';
import express, { Application } from 'express';
import retroRoutes from '../../routes/retroRoutes';
import { retros } from '../../data/retros';

// Create test app
const createTestApp = (): Application => {
  const app = express();
  app.use(express.json());
  app.use('/api/retros', retroRoutes);
  return app;
};

describe('Retro Routes', () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
    // Clear retros array before each test
    retros.length = 0;
  });

  describe('GET /api/retros', () => {
    it('should return 200 and empty array when no retros exist', async () => {
      const response = await request(app).get('/api/retros');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return 200 and array of retros', async () => {
      // Create a retro first
      await request(app)
        .post('/api/retros')
        .send({ sessionName: 'Test Retro', templateId: '1' });

      const response = await request(app).get('/api/retros');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
    });
  });

  describe('GET /api/retros/:id', () => {
    it('should return 404 when retro not found', async () => {
      const response = await request(app).get('/api/retros/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 200 and retro when found', async () => {
      // Create a retro first
      const createResponse = await request(app)
        .post('/api/retros')
        .send({ sessionName: 'Test Retro', templateId: '1' });

      const retroId = createResponse.body.id;
      const response = await request(app).get(`/api/retros/${retroId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', retroId);
      expect(response.body).toHaveProperty('sessionName', 'Test Retro');
    });
  });

  describe('POST /api/retros', () => {
    it('should return 400 when sessionName is missing', async () => {
      const response = await request(app)
        .post('/api/retros')
        .send({ templateId: '1' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when templateId is missing', async () => {
      const response = await request(app)
        .post('/api/retros')
        .send({ sessionName: 'Test Retro' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when template is invalid', async () => {
      const response = await request(app)
        .post('/api/retros')
        .send({ sessionName: 'Test Retro', templateId: 'invalid-template' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid template');
    });

    it('should return 201 and create retro with valid data', async () => {
      const response = await request(app)
        .post('/api/retros')
        .send({ sessionName: 'Test Retro', templateId: '1' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('sessionName', 'Test Retro');
      expect(response.body).toHaveProperty('templateId', '1');
    });

    it('should create retro with custom options', async () => {
      const response = await request(app)
        .post('/api/retros')
        .send({
          sessionName: 'Custom Retro',
          templateId: '1',
          isAnonymous: true,
          votingLimit: 5,
          timerDuration: 300
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('isAnonymous', true);
      expect(response.body).toHaveProperty('votingLimit', 5);
      expect(response.body).toHaveProperty('timerDuration', 300);
    });
  });

  describe('PATCH /api/retros/:id', () => {
    it('should return 404 when retro not found', async () => {
      const response = await request(app)
        .patch('/api/retros/nonexistent')
        .send({ sessionName: 'Updated Name' });

      expect(response.status).toBe(404);
    });

    it('should return 200 and update retro', async () => {
      // Create a retro first
      const createResponse = await request(app)
        .post('/api/retros')
        .send({ sessionName: 'Test Retro', templateId: '1' });

      const retroId = createResponse.body.id;
      const response = await request(app)
        .patch(`/api/retros/${retroId}`)
        .send({ sessionName: 'Updated Retro' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sessionName', 'Updated Retro');
    });
  });

  describe('DELETE /api/retros/:id', () => {
    it('should return 404 when retro not found', async () => {
      const response = await request(app).delete('/api/retros/nonexistent');

      expect(response.status).toBe(404);
    });

    it('should return 200 and delete retro', async () => {
      // Create a retro first
      const createResponse = await request(app)
        .post('/api/retros')
        .send({ sessionName: 'Test Retro', templateId: '1' });

      const retroId = createResponse.body.id;
      const response = await request(app).delete(`/api/retros/${retroId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');

      // Verify deletion
      const getResponse = await request(app).get(`/api/retros/${retroId}`);
      expect(getResponse.status).toBe(404);
    });
  });

  describe('PATCH /api/retros/:id/status', () => {
    it('should return 404 when retro not found', async () => {
      const response = await request(app)
        .patch('/api/retros/nonexistent/status')
        .send({ status: 'active' });

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid status', async () => {
      // Create a retro first
      const createResponse = await request(app)
        .post('/api/retros')
        .send({ sessionName: 'Test Retro', templateId: '1' });

      const retroId = createResponse.body.id;
      const response = await request(app)
        .patch(`/api/retros/${retroId}/status`)
        .send({ status: 'invalid-status' });

      expect(response.status).toBe(400);
    });

    it('should return 200 and update status', async () => {
      // Create a retro first
      const createResponse = await request(app)
        .post('/api/retros')
        .send({ sessionName: 'Test Retro', templateId: '1' });

      const retroId = createResponse.body.id;
      const response = await request(app)
        .patch(`/api/retros/${retroId}/status`)
        .send({ status: 'active' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'active');
    });
  });
});
