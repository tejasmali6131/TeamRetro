import { Request, Response, NextFunction } from 'express';
import { errorHandler, notFoundHandler, AppError } from '../../middleware/errorHandler';

// Helper to create mock request/response
const mockRequest = (url = '/test', method = 'GET') => ({
  url,
  method,
}) as unknown as Request;

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn() as NextFunction;

describe('ErrorHandler Middleware', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('errorHandler', () => {
    it('should return appropriate status code and message', () => {
      const req = mockRequest('/api/test', 'POST');
      const res = mockResponse();

      // Default 500 status
      const error500: AppError = new Error('Something went wrong');
      errorHandler(error500, req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          statusCode: 500,
          message: 'Something went wrong',
        })
      );

      // Custom status code (404)
      const error404: AppError = new Error('Not Found');
      error404.statusCode = 404;
      const res2 = mockResponse();
      errorHandler(error404, req, res2, mockNext);
      expect(res2.status).toHaveBeenCalledWith(404);

      // Default message when empty
      const errorEmpty: AppError = new Error();
      errorEmpty.message = '';
      const res3 = mockResponse();
      errorHandler(errorEmpty, req, res3, mockNext);
      expect(res3.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Internal Server Error' })
      );

      // Logs error details
      expect(console.error).toHaveBeenCalledWith('Error:', expect.objectContaining({
        message: expect.any(String),
        url: '/api/test',
        method: 'POST',
      }));
    });

    it('should include stack trace only in development mode', () => {
      const req = mockRequest();

      // Development mode - include stack
      process.env.NODE_ENV = 'development';
      const error: AppError = new Error('Dev error');
      const res = mockResponse();
      errorHandler(error, req, res, mockNext);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ stack: expect.any(String) })
      );

      // Production mode - no stack
      process.env.NODE_ENV = 'production';
      const res2 = mockResponse();
      errorHandler(error, req, res2, mockNext);
      const jsonCall = (res2.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.stack).toBeUndefined();
    });

    it('should handle operational errors with custom status codes', () => {
      const error: AppError = new Error('Operational error');
      error.statusCode = 422;
      error.isOperational = true;
      const res = mockResponse();

      errorHandler(error, mockRequest(), res, mockNext);

      expect(res.status).toHaveBeenCalledWith(422);
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 status code with route path in message', () => {
      const testCases = [
        { url: '/api/unknown', expected: 'Route /api/unknown not found' },
        { url: '/', expected: 'Route / not found' },
        { url: '/api/retros/123/participants', expected: 'Route /api/retros/123/participants not found' },
      ];

      testCases.forEach(({ url, expected }) => {
        const req = mockRequest(url);
        const res = mockResponse();

        notFoundHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          status: 'error',
          statusCode: 404,
          message: expected,
        });
      });
    });
  });
});
