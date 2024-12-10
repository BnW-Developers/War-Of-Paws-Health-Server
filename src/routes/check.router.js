import express from 'express';
import { CheckController } from '../controllers/check.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
const router = express.Router();

const checkController = new CheckController();

router.get('/svrStatus', authMiddleware, checkController.getSvrStatus);
router.post('/availableSvr', authMiddleware, checkController.getAvailableSvr);
router.post('/svrStatus', authMiddleware, checkController.setSvrStatus);

export default router;
