import React from "react";

export default function ResultViewer({ result }) {
  if (!result)
    return <div className="p-4 text-sm text-gray-600">No results yet</div>;
  if (!result.ok)
    return (
      <div className="p-4 text-red-600">
        {result.error || JSON.stringify(result)}
      </div>
    );

  const rows = result.rows || [];
  const fields =
    rows.length > 0
      ? Object.keys(rows[0])
      : (result.fields || []).map((f) => f.name);

  return (
    <div className="p-4 bg-white rounded shadow mt-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">Result Viewer</h3>
        <div className="text-sm text-gray-600">Rows: {result.rowCount}</div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              {fields.map((f, i) => (
                <th key={i} className="border px-2 py-1">
                  {f}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri}>
                {fields.map((f, fi) => (
                  <td key={fi} className="border px-2 py-1">
                    {String(r[f] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
