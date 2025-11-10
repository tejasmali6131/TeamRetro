import { Request, Response } from 'express';
import { getAllTemplates as getTemplates, getTemplateById as getTemplate, addTemplate } from '../data/templates';

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

export const createTemplate = (req: Request, res: Response): void => {
  try {
    const { name, description, columns } = req.body;
    
    if (!name || !columns || columns.length === 0) {
      res.status(400).json({ message: 'Name and columns are required' });
      return;
    }
    
    const newTemplate = addTemplate({
      name,
      description,
      columns,
      isDefault: false,
      createdBy: 'user'
    });
    
    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ message: 'Failed to create template' });
  }
};
