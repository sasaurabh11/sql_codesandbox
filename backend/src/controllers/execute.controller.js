import { pool } from "../db/postgres.js";

export async function executeSQL(req, res) {
  const { workspaceId, sql } = req.body;
  const schema = `workspace_${workspaceId}`;

  const client = await pool.connect();
  try {
    await client.query(`SET search_path TO ${schema};`);

    // Syntax validation only — does NOT run the query
    try {
      await client.query(`PREPARE stmt AS ${sql}`);
      await client.query(`DEALLOCATE stmt`);
    } catch (syntaxErr) {
      return res.status(400).json({
        ok: false,
        error: `SQL Syntax Error: ${syntaxErr.message}`,
        code: syntaxErr.code,
      });
    }

    const start = Date.now();
    const result = await client.query(sql);
    const duration = Date.now() - start;

    const fields = result.fields
      ? result.fields.map((f) => ({ name: f.name, dataTypeID: f.dataTypeID }))
      : [];

    return res.json({
      ok: true,
      rows: result.rows,
      rowCount: result.rowCount,
      fields,
      duration,
    });
  } catch (err) {
    return res.status(400).json({
      ok: false,
      error: err.message,
      code: err.code,
    });
  } finally {
    client.release();
  }
}
