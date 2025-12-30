import { Request, Response } from 'express';
import {
  getAllTemplates,
  getTemplateById,
} from '../../controllers/templateController';

// Mock the data layer
jest.mock('../../data/templates', () => ({
  getAllTemplates: jest.fn(),
  getTemplateById: jest.fn(),
}));

// Helper to create mock request/response
const mockRequest = (params = {}, body = {}, query = {}) => ({
  params,
  body,
  query,
}) as unknown as Request;

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('TemplateController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllTemplates', () => {
    it('should return all templates with status 200', () => {
      const mockTemplates = [
        { id: '1', name: 'Start/Stop/Continue', description: 'Basic retro template' },
        { id: '2', name: 'Mad/Sad/Glad', description: 'Emotional retro template' },
        { id: '3', name: 'Liked/Learned/Lacked', description: 'Learning retro template' },
      ];

      const { getAllTemplates: getTemplatesMock } = require('../../data/templates');
      getTemplatesMock.mockReturnValue(mockTemplates);

      const req = mockRequest();
      const res = mockResponse();

      getAllTemplates(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTemplates);
    });

    it('should return empty array when no templates exist', () => {
      const { getAllTemplates: getTemplatesMock } = require('../../data/templates');
      getTemplatesMock.mockReturnValue([]);

      const req = mockRequest();
      const res = mockResponse();

      getAllTemplates(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should return templates with full column data', () => {
      const mockTemplates = [
        {
          id: '1',
          name: 'Start/Stop/Continue',
          description: 'Basic retro template',
          columns: [
            { id: 'col-1', name: 'Start', color: '#10B981', order: 1 },
            { id: 'col-2', name: 'Stop', color: '#EF4444', order: 2 },
            { id: 'col-3', name: 'Continue', color: '#3B82F6', order: 3 },
          ],
          isDefault: true,
        },
      ];

      const { getAllTemplates: getTemplatesMock } = require('../../data/templates');
      getTemplatesMock.mockReturnValue(mockTemplates);

      const req = mockRequest();
      const res = mockResponse();

      getAllTemplates(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTemplates);
      expect(mockTemplates[0].columns).toHaveLength(3);
    });

    it('should return 500 on error', () => {
      const { getAllTemplates: getTemplatesMock } = require('../../data/templates');
      getTemplatesMock.mockImplementation(() => {
        throw new Error('Database error');
      });

      const req = mockRequest();
      const res = mockResponse();

      getAllTemplates(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Failed to fetch templates' });
    });
  });

  describe('getTemplateById', () => {
    it('should return template when found', () => {
      const mockTemplate = {
        id: 'template-1',
        name: 'Start/Stop/Continue',
        description: 'Identify actions to start, stop, and continue',
        columns: [
          { id: 'col-1', name: 'Start', color: '#10B981', order: 1, placeholder: 'What should we start doing?' },
          { id: 'col-2', name: 'Stop', color: '#EF4444', order: 2, placeholder: 'What should we stop doing?' },
          { id: 'col-3', name: 'Continue', color: '#3B82F6', order: 3, placeholder: 'What should we continue doing?' },
        ],
        isDefault: true,
        createdBy: 'system',
      };

      const { getTemplateById: getTemplateMock } = require('../../data/templates');
      getTemplateMock.mockReturnValue(mockTemplate);

      const req = mockRequest({ id: 'template-1' });
      const res = mockResponse();

      getTemplateById(req, res);

      expect(getTemplateMock).toHaveBeenCalledWith('template-1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTemplate);
    });

    it('should return 404 when template not found', () => {
      const { getTemplateById: getTemplateMock } = require('../../data/templates');
      getTemplateMock.mockReturnValue(null);

      const req = mockRequest({ id: 'non-existent' });
      const res = mockResponse();

      getTemplateById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Template not found' });
    });

    it('should return 404 when template not found with undefined', () => {
      const { getTemplateById: getTemplateMock } = require('../../data/templates');
      getTemplateMock.mockReturnValue(undefined);

      const req = mockRequest({ id: 'undefined-template' });
      const res = mockResponse();

      getTemplateById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Template not found' });
    });

    it('should return 500 on error', () => {
      const { getTemplateById: getTemplateMock } = require('../../data/templates');
      getTemplateMock.mockImplementation(() => {
        throw new Error('Database error');
      });

      const req = mockRequest({ id: 'template-1' });
      const res = mockResponse();

      getTemplateById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Failed to fetch template' });
    });

    it('should handle various template IDs', () => {
      const mockTemplate = { id: 'mad-sad-glad', name: 'Mad/Sad/Glad' };

      const { getTemplateById: getTemplateMock } = require('../../data/templates');
      getTemplateMock.mockReturnValue(mockTemplate);

      const req = mockRequest({ id: 'mad-sad-glad' });
      const res = mockResponse();

      getTemplateById(req, res);

      expect(getTemplateMock).toHaveBeenCalledWith('mad-sad-glad');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
