// src/routes/execute.js
import express from 'express';
import { pool } from '../db/postgres.js';

const router = express.Router();

/**
 * POST /api/execute
 * body: { workspaceId, sql }
 *
 * Executes raw SQL inside the workspace schema:
 * - sets search_path to workspace schema
 * - runs SQL and returns structured result or error
 */
router.post('/', async (req, res) => {
  const { workspaceId, sql } = req.body;

  if (!workspaceId || !sql) {
    return res.status(400).json({
      ok: false,
      error: 'workspaceId and sql are required'
    });
  }

  const schema = `workspace_${workspaceId}`;
  const client = await pool.connect();

  try {
    await client.query(`SET search_path TO ${schema}`);
    const start = Date.now();
    const result = await client.query(sql);
    const duration = Date.now() - start;

    const fields = result.fields
      ? result.fields.map(f => ({
          name: f.name,
          dataTypeID: f.dataTypeID
        }))
      : [];

    res.json({
      ok: true,
      rows: result.rows,
      rowCount: result.rowCount,
      fields,
      duration
    });
  } catch (err) {
    res.status(400).json({
      ok: false,
      error: err.message,
      code: err.code
    });
  } finally {
    client.release();
  }
});

export default router;
