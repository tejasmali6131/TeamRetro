import { Request, Response } from 'express';
import {
  getAllRetros,
  getRetroById,
  createRetro,
  updateRetro,
  deleteRetro,
  updateRetroStatus,
} from '../../controllers/retroController';

// Mock the data layer
jest.mock('../../data/retros', () => ({
  getAllRetros: jest.fn(),
  getRetroById: jest.fn(),
  createRetro: jest.fn(),
  updateRetro: jest.fn(),
  deleteRetro: jest.fn(),
  getParticipantsByRetroId: jest.fn(),
}));

jest.mock('../../data/templates', () => ({
  getTemplateById: jest.fn(),
}));

jest.mock('../../websocket/websocketManager', () => ({
  wsManager: {
    getRoomParticipants: jest.fn(),
  },
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

describe('RetroController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllRetros', () => {
    it('should return all retros or empty array with status 200', () => {
      const mockRetros = [
        { id: '1', sessionName: 'Sprint 1 Retro' },
        { id: '2', sessionName: 'Sprint 2 Retro' },
      ];

      const { getAllRetros: getRetrosMock } = require('../../data/retros');
      getRetrosMock.mockReturnValue(mockRetros);

      const req = mockRequest();
      const res = mockResponse();

      getAllRetros(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRetros);

      // Test empty case
      getRetrosMock.mockReturnValue([]);
      getAllRetros(req, res);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should return 500 on error', () => {
      const { getAllRetros: getRetrosMock } = require('../../data/retros');
      getRetrosMock.mockImplementation(() => {
        throw new Error('Database error');
      });

      const req = mockRequest();
      const res = mockResponse();

      getAllRetros(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Failed to fetch retrospectives' });
    });
  });

  describe('getRetroById', () => {
    it('should return 404 when retro not found, 500 on error', () => {
      const { getRetroById: getRetroMock } = require('../../data/retros');
      
      // Test 404
      getRetroMock.mockReturnValue(null);
      const req = mockRequest({ id: 'non-existent' });
      const res = mockResponse();
      getRetroById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Retrospective not found' });

      // Test 500
      getRetroMock.mockImplementation(() => { throw new Error('Database error'); });
      const res2 = mockResponse();
      getRetroById(mockRequest({ id: '1' }), res2);
      expect(res2.status).toHaveBeenCalledWith(500);
    });

    it('should return retro with participants from WebSocket or storage fallback', () => {
      const mockRetro = { id: '1', sessionName: 'Sprint 1', templateId: 'template-1' };
      const mockTemplate = { id: 'template-1', name: 'Start Stop Continue' };
      const mockWsParticipants = [{ id: 'user-1', name: 'Tiger', isCreator: true }];
      const mockStorageParticipants = [{ id: 'user-2', name: 'Lion', joinedAt: new Date() }];

      const { getRetroById: getRetroMock, getParticipantsByRetroId } = require('../../data/retros');
      const { getTemplateById } = require('../../data/templates');
      const { wsManager } = require('../../websocket/websocketManager');

      getRetroMock.mockReturnValue(mockRetro);
      getTemplateById.mockReturnValue(mockTemplate);
      wsManager.getRoomParticipants.mockReturnValue(mockWsParticipants);

      const req = mockRequest({ id: '1' });
      const res = mockResponse();

      getRetroById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        ...mockRetro,
        template: mockTemplate,
        participants: mockWsParticipants,
      });

      // Test storage fallback
      wsManager.getRoomParticipants.mockReturnValue([]);
      getParticipantsByRetroId.mockReturnValue(mockStorageParticipants);

      const res2 = mockResponse();
      getRetroById(req, res2);

      expect(getParticipantsByRetroId).toHaveBeenCalledWith('1');
    });
  });

  describe('createRetro', () => {
    it('should return 400 for validation errors', () => {
      const { getTemplateById } = require('../../data/templates');
      const res = mockResponse();

      // Missing sessionName
      createRetro(mockRequest({}, { templateId: 'template-1' }), res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Session name and template are required' });

      // Missing templateId
      const res2 = mockResponse();
      createRetro(mockRequest({}, { sessionName: 'My Retro' }), res2);
      expect(res2.status).toHaveBeenCalledWith(400);

      // Invalid template
      getTemplateById.mockReturnValue(null);
      const res3 = mockResponse();
      createRetro(mockRequest({}, { sessionName: 'My Retro', templateId: 'invalid' }), res3);
      expect(res3.status).toHaveBeenCalledWith(400);
      expect(res3.json).toHaveBeenCalledWith({ message: 'Invalid template ID' });
    });

    it('should create retro with default and custom options', () => {
      const mockTemplate = { id: 'template-1', name: 'Start Stop Continue' };
      const mockNewRetro = { id: 'new-id', sessionName: 'My Retro', templateId: 'template-1' };

      const { getTemplateById } = require('../../data/templates');
      const { createRetro: createRetroMock } = require('../../data/retros');

      getTemplateById.mockReturnValue(mockTemplate);
      createRetroMock.mockReturnValue(mockNewRetro);

      // Test default values
      const req = mockRequest({}, { sessionName: 'My Retro', templateId: 'template-1' });
      const res = mockResponse();

      createRetro(req, res);

      expect(createRetroMock).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionName: 'My Retro',
          templateId: 'template-1',
          isAnonymous: false,
          votingLimit: 5,
          reactionsEnabled: true,
          nameDeck: 'random',
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);

      // Test custom options
      const reqCustom = mockRequest({}, {
        sessionName: 'My Retro',
        templateId: 'template-1',
        isAnonymous: true,
        votingLimit: 10,
        nameDeck: 'animals',
      });
      createRetro(reqCustom, mockResponse());

      expect(createRetroMock).toHaveBeenCalledWith(
        expect.objectContaining({ isAnonymous: true, votingLimit: 10, nameDeck: 'animals' })
      );
    });

    it('should return 500 on error', () => {
      const { getTemplateById } = require('../../data/templates');
      getTemplateById.mockImplementation(() => { throw new Error('Database error'); });

      const req = mockRequest({}, { sessionName: 'My Retro', templateId: 'template-1' });
      const res = mockResponse();

      createRetro(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateRetro', () => {
    it('should update retro successfully or return 404 if not found', () => {
      const mockUpdatedRetro = { id: '1', sessionName: 'Updated Retro', context: 'New context' };
      const { updateRetro: updateRetroMock } = require('../../data/retros');
      updateRetroMock.mockReturnValue(mockUpdatedRetro);

      // Success case with multiple fields
      const req = mockRequest({ id: '1' }, {
        sessionName: 'Updated Retro',
        context: 'New context',
        isAnonymous: true,
        votingLimit: 10,
      });
      const res = mockResponse();

      updateRetro(req, res);

      expect(updateRetroMock).toHaveBeenCalledWith('1', {
        sessionName: 'Updated Retro',
        context: 'New context',
        isAnonymous: true,
        votingLimit: 10,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUpdatedRetro);

      // 404 case
      updateRetroMock.mockReturnValue(null);
      const res2 = mockResponse();
      updateRetro(mockRequest({ id: 'non-existent' }, { sessionName: 'Updated' }), res2);
      expect(res2.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', () => {
      const { updateRetro: updateRetroMock } = require('../../data/retros');
      updateRetroMock.mockImplementation(() => { throw new Error('Database error'); });

      const res = mockResponse();
      updateRetro(mockRequest({ id: '1' }, { sessionName: 'Updated' }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteRetro', () => {
    it('should delete retro successfully or return 404 if not found', () => {
      const { deleteRetro: deleteRetroMock } = require('../../data/retros');
      
      // Success case
      deleteRetroMock.mockReturnValue(true);
      const res = mockResponse();
      deleteRetro(mockRequest({ id: '1' }), res);
      expect(deleteRetroMock).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Retrospective deleted successfully' });

      // 404 case
      deleteRetroMock.mockReturnValue(false);
      const res2 = mockResponse();
      deleteRetro(mockRequest({ id: 'non-existent' }), res2);
      expect(res2.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', () => {
      const { deleteRetro: deleteRetroMock } = require('../../data/retros');
      deleteRetroMock.mockImplementation(() => { throw new Error('Database error'); });

      const res = mockResponse();
      deleteRetro(mockRequest({ id: '1' }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateRetroStatus', () => {
    it('should update valid status (active/completed) or return 400 for invalid', () => {
      const mockUpdatedRetro = { id: '1', status: 'active' };
      const { updateRetro: updateRetroMock } = require('../../data/retros');
      updateRetroMock.mockReturnValue(mockUpdatedRetro);

      // Valid status - active
      const res = mockResponse();
      updateRetroStatus(mockRequest({ id: '1' }, { status: 'active' }), res);
      expect(updateRetroMock).toHaveBeenCalledWith('1', { status: 'active' });
      expect(res.status).toHaveBeenCalledWith(200);

      // Valid status - completed
      mockUpdatedRetro.status = 'completed';
      const res2 = mockResponse();
      updateRetroStatus(mockRequest({ id: '1' }, { status: 'completed' }), res2);
      expect(res2.status).toHaveBeenCalledWith(200);

      // Invalid status
      const res3 = mockResponse();
      updateRetroStatus(mockRequest({ id: '1' }, { status: 'invalid-status' }), res3);
      expect(res3.status).toHaveBeenCalledWith(400);
      expect(res3.json).toHaveBeenCalledWith({ message: 'Invalid status' });
    });

    it('should return 404 when retro not found or 500 on error', () => {
      const { updateRetro: updateRetroMock } = require('../../data/retros');
      
      // 404 case
      updateRetroMock.mockReturnValue(null);
      const res = mockResponse();
      updateRetroStatus(mockRequest({ id: 'non-existent' }, { status: 'active' }), res);
      expect(res.status).toHaveBeenCalledWith(404);

      // 500 case
      updateRetroMock.mockImplementation(() => { throw new Error('Database error'); });
      const res2 = mockResponse();
      updateRetroStatus(mockRequest({ id: '1' }, { status: 'active' }), res2);
      expect(res2.status).toHaveBeenCalledWith(500);
    });
  });
});
