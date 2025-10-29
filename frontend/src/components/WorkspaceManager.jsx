import React, { useState } from "react";
import { createWorkspace, getWorkspace, loadWorkspace } from "../api";

export default function WorkspaceManager({ onWorkspaceSet }) {
  const [name, setName] = useState("My Workspace");
  const [workspaceId, setWorkspaceId] = useState("");
  const [status, setStatus] = useState(null);
  const [workspaceData, setWorkspaceData] = useState(null);

  async function handleCreate() {
    setStatus("creating...");
    const payload = { workspaceId: workspaceId || undefined, name, tables: [] };
    const { ok, body } = await createWorkspace(payload);
    if (ok) {
      setStatus("created " + body.workspaceId);
      onWorkspaceSet(body.workspaceId);
      setWorkspaceData(null);
    } else {
      setStatus("error: " + JSON.stringify(body.body || body));
    }
  }

  async function handleLoad() {
    if (!workspaceId) return setStatus("provide workspaceId to load");
    setStatus("loading...");
    const res = await loadWorkspace(workspaceId);
    if (res.ok) {
      setStatus("loaded into Postgres");
      onWorkspaceSet(workspaceId);
    } else {
      setStatus("error: " + JSON.stringify(res.body));
    }
  }

  async function handleFetch() {
    if (!workspaceId) return setStatus("provide workspaceId to fetch");
    setStatus("fetching...");
    const res = await getWorkspace(workspaceId);
    if (res.ok) {
      setWorkspaceData(res.body.workspace);
      setStatus("fetched");
    } else {
      setStatus("error: " + JSON.stringify(res.body));
    }
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="font-semibold mb-2">Workspace</h3>
      <div className="flex gap-2">
        <input
          className="border p-2 flex-1"
          placeholder="workspaceId"
          value={workspaceId}
          onChange={(e) => setWorkspaceId(e.target.value)}
        />
        <input
          className="border p-2 w-48"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-3 rounded"
          onClick={handleCreate}
        >
          Create
        </button>
        <button
          className="bg-green-600 text-white px-3 rounded"
          onClick={handleLoad}
        >
          Load
        </button>
        <button
          className="bg-gray-600 text-white px-3 rounded"
          onClick={handleFetch}
        >
          Fetch
        </button>
      </div>

      <div className="mt-2 text-sm text-gray-600">Status: {status}</div>

      {/* ✅ Show Workspace Data */}
      {workspaceData && (
        <div className="mt-4 bg-gray-50 border p-4 rounded">
          <h4 className="font-semibold text-lg mb-2">
            {workspaceData.name} (ID: {workspaceData.workspaceId})
          </h4>

          {workspaceData.tables.map((tbl, i) => (
            <div key={i} className="mb-4 border rounded p-3 bg-white">
              <h5 className="font-semibold mb-2 text-indigo-600">
                {tbl.tableName}
              </h5>

              <table className="min-w-full text-sm border">
                <thead>
                  <tr className="bg-gray-200">
                    {tbl.columns.map((c, ci) => (
                      <th key={ci} className="border px-2 py-1">
                        {c.columnName}
                        <div className="text-xs text-gray-500">
                          {c.dataType}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {tbl.rows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="border px-2 py-1">
                          {cell === null ? "NULL" : cell.toString()}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
