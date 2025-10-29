import express from 'express';
import validateWorkspaceId from '../middlewares/validateWorkspaceId.middleware.js';
import {
  createWorkspace,
  getWorkspace,
  loadWorkspace,
  saveWorkspace
} from '../controllers/workspace.controller.js';

const router = express.Router();

router.post('/', validateWorkspaceId, createWorkspace);
router.get('/:workspaceId', validateWorkspaceId, getWorkspace);
router.post('/:workspaceId/load', validateWorkspaceId, loadWorkspace);
router.post('/:workspaceId/save', validateWorkspaceId, saveWorkspace);

export default router;
