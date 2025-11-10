import { Request, Response } from 'express';
import {
  getAllRetros as getRetros,
  getRetroById as getRetro,
  createRetro as addRetro,
  updateRetro as modifyRetro,
  deleteRetro as removeRetro,
  addParticipant,
  getParticipantsByRetroId
} from '../data/retros';
import { getTemplateById } from '../data/templates';
import { generateRandomName } from '../data/names';

export const getAllRetros = (_req: Request, res: Response): void => {
  try {
    const retros = getRetros();
    res.status(200).json(retros);
  } catch (error) {
    console.error('Error fetching retros:', error);
    res.status(500).json({ message: 'Failed to fetch retrospectives' });
  }
};

export const getRetroById = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const retro = getRetro(id);
    
    if (!retro) {
      res.status(404).json({ message: 'Retrospective not found' });
      return;
    }
    
    const template = getTemplateById(retro.templateId);
    const participants = getParticipantsByRetroId(id);
    
    res.status(200).json({
      ...retro,
      template,
      participants
    });
  } catch (error) {
    console.error('Error fetching retro:', error);
    res.status(500).json({ message: 'Failed to fetch retrospective' });
  }
};

export const createRetro = (req: Request, res: Response): void => {
  try {
    const { sessionName, context, templateId, isAnonymous, votingLimit, timerDuration } = req.body;
    
    if (!sessionName || !templateId) {
      res.status(400).json({ message: 'Session name and template are required' });
      return;
    }
    
    const template = getTemplateById(templateId);
    if (!template) {
      res.status(400).json({ message: 'Invalid template ID' });
      return;
    }
    
    const newRetro = addRetro({
      sessionName,
      context: context || '',
      templateId,
      isAnonymous: isAnonymous || false,
      votingLimit: votingLimit || 5,
      timerDuration: timerDuration || null,
      status: 'draft'
    });
    
    res.status(201).json(newRetro);
  } catch (error) {
    console.error('Error creating retro:', error);
    res.status(500).json({ message: 'Failed to create retrospective' });
  }
};

export const updateRetro = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { sessionName, context, isAnonymous, votingLimit, timerDuration, status } = req.body;
    
    const updatedRetro = modifyRetro(id, {
      ...(sessionName && { sessionName }),
      ...(context !== undefined && { context }),
      ...(isAnonymous !== undefined && { isAnonymous }),
      ...(votingLimit !== undefined && { votingLimit }),
      ...(timerDuration !== undefined && { timerDuration }),
      ...(status && { status })
    });
    
    if (!updatedRetro) {
      res.status(404).json({ message: 'Retrospective not found' });
      return;
    }
    
    res.status(200).json(updatedRetro);
  } catch (error) {
    console.error('Error updating retro:', error);
    res.status(500).json({ message: 'Failed to update retrospective' });
  }
};

export const deleteRetro = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const deleted = removeRetro(id);
    
    if (!deleted) {
      res.status(404).json({ message: 'Retrospective not found' });
      return;
    }
    
    res.status(200).json({ message: 'Retrospective deleted successfully' });
  } catch (error) {
    console.error('Error deleting retro:', error);
    res.status(500).json({ message: 'Failed to delete retrospective' });
  }
};

export const updateRetroStatus = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['draft', 'active', 'voting', 'completed'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }
    
    const updatedRetro = modifyRetro(id, { status });
    
    if (!updatedRetro) {
      res.status(404).json({ message: 'Retrospective not found' });
      return;
    }
    
    res.status(200).json(updatedRetro);
  } catch (error) {
    console.error('Error updating retro status:', error);
    res.status(500).json({ message: 'Failed to update retrospective status' });
  }
};

export const joinRetro = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    
    const retro = getRetro(id);
    if (!retro) {
      res.status(404).json({ message: 'Retrospective not found' });
      return;
    }
    
    const randomName = generateRandomName(id);
    const participant = addParticipant({
      retroId: id,
      name: randomName
    });
    
    res.status(200).json({
      participant,
      retro
    });
  } catch (error) {
    console.error('Error joining retro:', error);
    res.status(500).json({ message: 'Failed to join retrospective' });
  }
};

export const getRetroParticipants = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    
    const retro = getRetro(id);
    if (!retro) {
      res.status(404).json({ message: 'Retrospective not found' });
      return;
    }
    
    const participants = getParticipantsByRetroId(id);
    res.status(200).json(participants);
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ message: 'Failed to fetch participants' });
  }
};
