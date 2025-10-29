import express from 'express';
import { executeSQL } from '../controllers/execute.controller.js';
import { validateExecuteRequest } from '../middlewares/validateExecute.middleware.js';

const router = express.Router();

router.post('/', validateExecuteRequest, executeSQL);

export default router;
