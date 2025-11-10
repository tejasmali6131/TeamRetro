import { Router } from 'express';
import { getAllTemplates, getTemplateById, createTemplate } from '../controllers/templateController';

const router = Router();

// Template routes
router.get('/', getAllTemplates);
router.get('/:id', getTemplateById);
router.post('/', createTemplate);

export default router;
