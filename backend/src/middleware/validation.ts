import { Request, Response, NextFunction } from 'express';

export const validateRetroCreation = (req: Request, res: Response, next: NextFunction): void => {
  const { sessionName, templateId } = req.body;

  if (!sessionName || sessionName.trim().length === 0) {
    res.status(400).json({ message: 'Session name is required' });
    return;
  }

  if (!templateId) {
    res.status(400).json({ message: 'Template is required' });
    return;
  }

  next();
};

export const validateCardCreation = (req: Request, res: Response, next: NextFunction): void => {
  const { retroId, columnId, content } = req.body;

  if (!retroId || !columnId || !content) {
    res.status(400).json({ 
      message: 'Retro ID, column ID, and content are required' 
    });
    return;
  }

  if (content.trim().length === 0) {
    res.status(400).json({ message: 'Card content cannot be empty' });
    return;
  }

  next();
};
