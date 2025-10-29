import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

const defaultTimeout = parseInt(
  process.env.PG_STATEMENT_TIMEOUT_MS || "5000",
  10
);

export async function connectPostgres() {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    console.log("✅ Connected to PostgreSQL");
  } catch (err) {
    console.error("❌ PostgreSQL Connection Error:", err.message);
    throw err;
  }
}

export async function queryWithTimeout(text, params = []) {
  const client = await pool.connect();
  try {
    await client.query(`SET statement_timeout = ${defaultTimeout}`);
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

export async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export { pool };
