import { Request, Response, NextFunction } from 'express';
import { validateRetroCreation } from '../../middleware/validation';

// Helper to create mock request/response
const mockRequest = (body = {}) => ({
  body,
}) as unknown as Request;

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Validation Middleware', () => {
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockNext = jest.fn();
  });

  describe('validateRetroCreation', () => {
    it('should call next() when valid data is provided', () => {
      const req = mockRequest({
        sessionName: 'Sprint 1 Retro',
        templateId: 'template-1',
        context: 'Sprint 5',
        isAnonymous: true,
        votingLimit: 10,
      });
      const res = mockResponse();

      validateRetroCreation(req, res, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      // Additional fields should pass through
      expect(req.body.context).toBe('Sprint 5');
    });

    it('should return 400 for invalid sessionName (missing, empty, whitespace)', () => {
      const invalidSessionNames = [
        { body: { templateId: 'template-1' }, desc: 'missing' },
        { body: { sessionName: '', templateId: 'template-1' }, desc: 'empty' },
        { body: { sessionName: '   ', templateId: 'template-1' }, desc: 'whitespace' },
      ];

      invalidSessionNames.forEach(({ body }) => {
        const req = mockRequest(body);
        const res = mockResponse();

        validateRetroCreation(req, res, mockNext as NextFunction);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Session name is required' });
      });
    });

    it('should return 400 for invalid templateId (missing or empty)', () => {
      const invalidTemplateIds = [
        { body: { sessionName: 'My Retro' }, desc: 'missing' },
        { body: { sessionName: 'My Retro', templateId: '' }, desc: 'empty' },
      ];

      invalidTemplateIds.forEach(({ body }) => {
        const req = mockRequest(body);
        const res = mockResponse();
        const localMockNext = jest.fn();

        validateRetroCreation(req, res, localMockNext as NextFunction);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Template is required' });
        expect(localMockNext).not.toHaveBeenCalled();
      });
    });

    it('should accept sessionName with leading/trailing spaces if not empty after trim', () => {
      const req = mockRequest({
        sessionName: '  Sprint Retro  ',
        templateId: 'start-stop-continue-123',
      });
      const res = mockResponse();

      validateRetroCreation(req, res, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
