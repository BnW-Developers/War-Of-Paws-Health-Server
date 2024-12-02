import express from 'express';
import checkRouters from './check.router.js';

const router = express.Router();

router.use('/check', checkRouters);

export default router;
