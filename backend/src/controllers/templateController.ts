import { Request, Response } from 'express';
import { getAllTemplates as getTemplates, getTemplateById as getTemplate } from '../data/templates';

export const getAllTemplates = (_req: Request, res: Response): void => {
  try {
    const templates = getTemplates();
    res.status(200).json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ message: 'Failed to fetch templates' });
  }
};

export const getTemplateById = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const template = getTemplate(id);
    
    if (!template) {
      res.status(404).json({ message: 'Template not found' });
      return;
    }
    
    res.status(200).json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ message: 'Failed to fetch template' });
  }
};
