import request from 'supertest';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import templateRoutes from '../routes/templateRoutes';
import retroRoutes from '../routes/retroRoutes';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler';

// Create a test version of the app without starting the server
const createTestApp = (): Application => {
  const app = express();

  // Middleware (same as server.ts)
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check route
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
  });

  // API Routes
  app.use('/api/templates', templateRoutes);
  app.use('/api/retros', retroRoutes);

  // Handle client-side routing - serve index.html for all non-API routes
  app.get('*', (req, res, next) => {
    // Skip API routes and WebSocket routes
    if (req.path.startsWith('/api') || req.path.startsWith('/ws') || req.path === '/health') {
      return next();
    }
    // In tests, just return 200 for SPA routes
    res.status(200).send('SPA Route');
  });

  // Error handling (only for API routes)
  app.use('/api', notFoundHandler);
  app.use(errorHandler);

  return app;
};

describe('Server', () => {
  let app: Application;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('Health Check', () => {
    it('should return 200 OK on /health', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'OK',
        message: 'Server is running'
      });
    });
  });

  describe('Middleware', () => {
    it('should parse JSON body', async () => {
      const response = await request(app)
        .post('/api/retros')
        .send({ sessionName: 'Test', templateId: '1' })
        .set('Content-Type', 'application/json');

      // Should not fail on JSON parsing (201 or 400 based on validation)
      expect([201, 400]).toContain(response.status);
    });

    it('should parse URL-encoded body', async () => {
      const response = await request(app)
        .post('/api/retros')
        .send('sessionName=Test&templateId=1')
        .set('Content-Type', 'application/x-www-form-urlencoded');

      expect([201, 400]).toContain(response.status);
    });

    it('should have CORS enabled', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should have security headers from helmet', async () => {
      const response = await request(app).get('/health');

      // Helmet adds various security headers
      expect(response.headers['x-dns-prefetch-control']).toBeDefined();
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBeDefined();
    });
  });

  describe('API Routes', () => {
    it('should route to /api/templates', async () => {
      const response = await request(app).get('/api/templates');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should route to /api/retros', async () => {
      const response = await request(app).get('/api/retros');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 404 for unknown API routes', async () => {
      const response = await request(app).get('/api/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Client-Side Routing (SPA)', () => {
    it('should serve SPA for non-API routes', async () => {
      const response = await request(app).get('/some-frontend-route');

      expect(response.status).toBe(200);
    });

    it('should serve SPA for nested routes', async () => {
      const response = await request(app).get('/retro/123/board');

      expect(response.status).toBe(200);
    });

    it('should not serve SPA for /api routes', async () => {
      const response = await request(app).get('/api/templates');

      expect(response.status).toBe(200);
      expect(response.body).not.toBe('SPA Route');
    });

    it('should not serve SPA for /health route', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for missing API endpoints', async () => {
      const response = await request(app).get('/api/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });

    it('should handle invalid JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/retros')
        .send('invalid json')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });
  });
});
