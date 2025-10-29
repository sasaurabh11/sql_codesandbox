import axios from "axios";

const BASE = import.meta.env.VITE_API_BASE || "";

function formatResponse(ok, resOrErr) {
  if (ok) {
    return { ok: true, status: resOrErr.status, body: resOrErr.data };
  } else {
    if (resOrErr.response) {
      return {
        ok: false,
        status: resOrErr.response.status,
        body: resOrErr.response.data,
      };
    }
    return { ok: false, status: 0, body: resOrErr.message };
  }
}

export const createWorkspace = async (payload) => {
  try {
    const res = await axios.post(`${BASE}/api/workspaces`, payload);
    return formatResponse(true, res);
  } catch (error) {
    return formatResponse(false, error);
  }
};

export const getWorkspace = async (id) => {
  try {
    const res = await axios.get(`${BASE}/api/workspaces/${id}`);
    return formatResponse(true, res);
  } catch (error) {
    return formatResponse(false, error);
  }
};

export const loadWorkspace = async (id) => {
  try {
    const res = await axios.post(`${BASE}/api/workspaces/${id}/load`);
    return formatResponse(true, res);
  } catch (error) {
    return formatResponse(false, error);
  }
};

export const saveWorkspace = async (id, body = {}) => {
  try {
    console.log("body", body);
    const res = await axios.post(`${BASE}/api/workspaces/${id}/save`, body);
    return formatResponse(true, res);
  } catch (error) {
    return formatResponse(false, error);
  }
};

export const executeSQL = async (workspaceId, sql) => {
  try {
    const res = await axios.post(`${BASE}/api/execute`, { workspaceId, sql });
    return formatResponse(true, res);
  } catch (error) {
    return formatResponse(false, error);
  }
};

export const getSQLHint = async (sql, schema) => {
  try {
    const res = await axios.post(`${BASE}/api/ai/hint`, { sql, schema });
    return formatResponse(true, res);
  } catch (error) {
    return formatResponse(false, error);
  }
};

export const fixSQL = async (sql) => {
  try {
    const res = await axios.post(`${BASE}/api/ai/fix`, { sql });
    return formatResponse(true, res);
  } catch (error) {
    return formatResponse(false, error);
  }
};

export const explainSQL = async (sql) => {
  try {
    const res = await axios.post(`${BASE}/api/ai/explain`, { sql });
    return formatResponse(true, res);
  } catch (error) {
    return formatResponse(false, error);
  }
};

export const completeSQL = async (prefix) => {
  try {
    const res = await axios.post(`${BASE}/api/ai/complete`, { prefix });
    return formatResponse(true, res);
  } catch (error) {
    return formatResponse(false, error);
  }
};
