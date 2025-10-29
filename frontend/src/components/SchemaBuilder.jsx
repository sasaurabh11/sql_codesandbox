import React, { useState } from "react";
import { saveWorkspace } from "../api";

function defaultColumn() {
  return {
    columnName: `col_${Date.now() % 1000000}`,
    dataType: "TEXT",
    primaryKey: false,
    unique: false,
    notNull: false,
    defaultValue: null,
    autoIncrement: false,
  };
}

function defaultRow(columns) {
  return columns.map(() => null);
}

export default function SchemaBuilder({ workspaceId, onSaved }) {
  const [tables, setTables] = useState([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState(null);

  function addTable() {
    setTables((prev) => {
      const cols = [defaultColumn()];
      return [
        ...prev,
        {
          tableName: `table_${prev.length + 1}`,
          columns: cols,
          rows: [defaultRow(cols)],
        },
      ];
    });
  }

  function updateTable(idx, patch) {
    setTables((t) =>
      t.map((tbl, i) => (i === idx ? { ...tbl, ...patch } : tbl))
    );
  }

  function setColumnProp(tableIdx, colIdx, patch) {
    setTables((t) =>
      t.map((tbl, ti) => {
        if (ti !== tableIdx) return tbl;
        const cols = tbl.columns.map((c, ci) =>
          ci === colIdx ? { ...c, ...patch } : c
        );
        if (patch.primaryKey) {
          for (let i = 0; i < cols.length; i++) {
            if (i !== colIdx) cols[i].primaryKey = false;
          }
        }
        if (patch.autoIncrement) {
          cols[colIdx].dataType = "INTEGER";
        }
        return { ...tbl, columns: cols };
      })
    );
  }

  function addColumn(tableIdx) {
    setTables((prev) =>
      prev.map((tbl, i) => {
        if (i !== tableIdx) return tbl;
        const newCols = [...tbl.columns, defaultColumn()];
        const newRows = tbl.rows.map((r) => [...r, null]);
        return { ...tbl, columns: newCols, rows: newRows };
      })
    );
  }

  function removeColumn(tableIdx, colIdx) {
    setTables((prev) =>
      prev.map((tbl, i) => {
        if (i !== tableIdx) return tbl;
        const newCols = tbl.columns.filter((_, j) => j !== colIdx);
        const newRows = tbl.rows.map((r) => r.filter((_, j) => j !== colIdx));
        return { ...tbl, columns: newCols, rows: newRows };
      })
    );
  }

  function addRow(tableIdx) {
    setTables((prev) =>
      prev.map((tbl, i) => {
        if (i !== tableIdx) return tbl;
        return { ...tbl, rows: [...tbl.rows, defaultRow(tbl.columns)] };
      })
    );
  }

  function removeRow(tableIdx, rowIdx) {
    setTables((prev) =>
      prev.map((tbl, i) => {
        if (i !== tableIdx) return tbl;
        const newRows = tbl.rows.filter((_, ri) => ri !== rowIdx);
        return { ...tbl, rows: newRows };
      })
    );
  }

  function setCell(tableIdx, rowIdx, colIdx, value) {
    setTables((prev) =>
      prev.map((tbl, ti) => {
        if (ti !== tableIdx) return tbl;
        const rows = tbl.rows.map((r, ri) =>
          ri === rowIdx ? r.map((c, ci) => (ci === colIdx ? value : c)) : r
        );
        return { ...tbl, rows };
      })
    );
  }

  function setColumnName(tableIdx, colIdx, name) {
    setColumnProp(tableIdx, colIdx, { columnName: name });
  }

  function setColumnType(tableIdx, colIdx, type) {
    setColumnProp(tableIdx, colIdx, { dataType: type });
  }

  function setDefaultValue(tableIdx, colIdx, def) {
    setColumnProp(tableIdx, colIdx, { defaultValue: def === "" ? null : def });
  }

  function toggleConstraintSimple(tableIdx, colIdx, key) {
    setTables((t) =>
      t.map((tbl, ti) => {
        if (ti !== tableIdx) return tbl;
        const cols = tbl.columns.map((c, ci) => {
          if (ci !== colIdx) return c;
          return { ...c, [key]: !c[key] };
        });
        if (key === "primaryKey") {
          for (let i = 0; i < cols.length; i++)
            if (i !== colIdx) cols[i].primaryKey = false;
        }
        if (key === "autoIncrement" && cols[colIdx].autoIncrement)
          cols[colIdx].dataType = "INTEGER";
        return { ...tbl, columns: cols };
      })
    );
  }

  async function handleSave() {
    if (!workspaceId) return setStatus("Set or create a workspace first");
    const payload = { name: name || `Workspace ${workspaceId}`, tables };
    setStatus("Saving...");
    try {
      const res = await saveWorkspace(workspaceId, payload);
      if (res.ok) {
        setStatus("Saved");
        onSaved && onSaved(res.body.workspace);
      } else {
        setStatus("Error: " + JSON.stringify(res.body));
      }
    } catch (e) {
      setStatus("Unexpected error: " + e.message);
    }
  }

  return (
    <div className="p-4 bg-white rounded shadow mt-4">
      <h3 className="font-semibold mb-3 text-lg">Schema Builder (Advanced)</h3>

      <div className="mb-3 flex gap-2">
        <input
          placeholder="Workspace Name (optional)"
          className="border p-2 flex-1 rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          className="bg-indigo-600 text-white px-3 rounded"
          onClick={addTable}
        >
          + Table
        </button>
        <button
          className="bg-green-600 text-white px-3 rounded"
          onClick={handleSave}
        >
          Save
        </button>
      </div>

      {tables.map((tbl, ti) => (
        <div key={ti} className="border rounded p-3 mb-4 bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <input
              value={tbl.tableName}
              onChange={(e) => updateTable(ti, { tableName: e.target.value })}
              className="border p-1 rounded"
            />
            <button
              className="bg-gray-200 px-2 rounded"
              onClick={() => addColumn(ti)}
            >
              + Column
            </button>
            <button
              className="bg-gray-200 px-2 rounded"
              onClick={() => addRow(ti)}
            >
              + Row
            </button>
          </div>

          {/* Constraint matrix header */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1">Column</th>
                  <th className="border px-2 py-1">Type</th>
                  <th className="border px-2 py-1">PK</th>
                  <th className="border px-2 py-1">Unique</th>
                  <th className="border px-2 py-1">Not Null</th>
                  <th className="border px-2 py-1">Default</th>
                  <th className="border px-2 py-1">AutoInc</th>
                  <th className="border px-2 py-1">Remove</th>
                </tr>
              </thead>
              <tbody>
                {tbl.columns.map((c, ci) => (
                  <tr key={ci}>
                    <td className="border px-2 py-1">
                      <input
                        value={c.columnName}
                        onChange={(e) => setColumnName(ti, ci, e.target.value)}
                        className="border p-1 rounded w-full"
                      />
                    </td>

                    <td className="border px-2 py-1">
                      <select
                        value={c.dataType}
                        onChange={(e) => setColumnType(ti, ci, e.target.value)}
                        className="border p-1 rounded"
                      >
                        <option>TEXT</option>
                        <option>INTEGER</option>
                        <option>BOOLEAN</option>
                        <option>DATE</option>
                        <option>REAL</option>
                      </select>
                    </td>

                    <td className="border px-2 py-1 text-center">
                      <input
                        type="checkbox"
                        checked={!!c.primaryKey}
                        onChange={() =>
                          toggleConstraintSimple(ti, ci, "primaryKey")
                        }
                      />
                    </td>

                    <td className="border px-2 py-1 text-center">
                      <input
                        type="checkbox"
                        checked={!!c.unique}
                        onChange={() =>
                          toggleConstraintSimple(ti, ci, "unique")
                        }
                      />
                    </td>

                    <td className="border px-2 py-1 text-center">
                      <input
                        type="checkbox"
                        checked={!!c.notNull}
                        onChange={() =>
                          toggleConstraintSimple(ti, ci, "notNull")
                        }
                      />
                    </td>

                    <td className="border px-2 py-1">
                      <input
                        value={c.defaultValue === null ? "" : c.defaultValue}
                        onChange={(e) =>
                          setDefaultValue(ti, ci, e.target.value)
                        }
                        className="border p-1 rounded w-full"
                        placeholder="e.g. 0 or 'hello'"
                      />
                    </td>

                    <td className="border px-2 py-1 text-center">
                      <input
                        type="checkbox"
                        checked={!!c.autoIncrement}
                        onChange={() =>
                          toggleConstraintSimple(ti, ci, "autoIncrement")
                        }
                        disabled={c.dataType !== "INTEGER"}
                      />
                    </td>

                    <td className="border px-2 py-1 text-center">
                      <button
                        className="text-red-600"
                        onClick={() => removeColumn(ti, ci)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead>
                <tr className="bg-white">
                  {tbl.columns.map((c, ci) => (
                    <th key={ci} className="border px-2 py-1">
                      {c.columnName}
                    </th>
                  ))}
                  <th className="border px-2 py-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tbl.rows.map((r, ri) => (
                  <tr key={ri}>
                    {r.map((cell, ci) => (
                      <td key={ci} className="border px-2 py-1">
                        <input
                          value={cell === null ? "" : cell}
                          onChange={(e) =>
                            setCell(ti, ri, ci, parseValue(e.target.value))
                          }
                          className="w-full p-1 rounded border"
                        />
                      </td>
                    ))}
                    <td className="border px-2 py-1 text-center">
                      <button
                        className="text-red-600"
                        onClick={() => removeRow(ti, ri)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="text-sm text-gray-700 mt-2">{status}</div>
    </div>
  );
}

function parseValue(v) {
  if (v === "") return null;
  if (!isNaN(v) && v.trim() !== "") return Number(v);
  if (v.toLowerCase && v.toLowerCase() === "true") return true;
  if (v.toLowerCase && v.toLowerCase() === "false") return false;
  return v;
}
