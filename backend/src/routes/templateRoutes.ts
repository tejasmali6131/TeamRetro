import { Router } from 'express';
import { getAllTemplates, getTemplateById } from '../controllers/templateController';

const router = Router();

// Template routes
router.get('/', getAllTemplates);
router.get('/:id', getTemplateById);

export default router;
