import request from 'supertest';
import express, { Application } from 'express';
import templateRoutes from '../../routes/templateRoutes';

// Create test app
const createTestApp = (): Application => {
  const app = express();
  app.use(express.json());
  app.use('/api/templates', templateRoutes);
  return app;
};

describe('Template Routes', () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('GET /api/templates', () => {
    it('should return 200 and array of templates', async () => {
      const response = await request(app).get('/api/templates');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return templates with required properties', async () => {
      const response = await request(app).get('/api/templates');

      expect(response.status).toBe(200);
      const template = response.body[0];
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('description');
      expect(template).toHaveProperty('columns');
    });
  });

  describe('GET /api/templates/:id', () => {
    it('should return 200 and template when found', async () => {
      const response = await request(app).get('/api/templates/0');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', '0');
      expect(response.body).toHaveProperty('name');
    });

    it('should return 404 when template not found', async () => {
      const response = await request(app).get('/api/templates/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });

    it('should return template with columns array', async () => {
      const response = await request(app).get('/api/templates/1');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.columns)).toBe(true);
      expect(response.body.columns.length).toBeGreaterThan(0);
    });
  });
});
