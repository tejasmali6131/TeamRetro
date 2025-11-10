import { Router } from 'express';
import {
  getAllRetros,
  getRetroById,
  createRetro,
  updateRetro,
  deleteRetro,
  updateRetroStatus,
  joinRetro,
  getRetroParticipants,
} from '../controllers/retroController';
import { validateRetroCreation } from '../middleware/validation';

const router = Router();

// Retro CRUD routes
router.get('/', getAllRetros);
router.get('/:id', getRetroById);
router.post('/', validateRetroCreation, createRetro);
router.patch('/:id', updateRetro);
router.delete('/:id', deleteRetro);

// Update retro status
router.patch('/:id/status', updateRetroStatus);

// Participant routes
router.post('/:id/join', joinRetro);
router.get('/:id/participants', getRetroParticipants);

export default router;
