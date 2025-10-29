import React from "react";

export default function ResultViewer({ result }) {
  if (!result)
    return (
      <div className="h-full flex items-center justify-center p-8 bg-gray-800 rounded-lg">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-400 text-lg mb-2">No results yet</p>
          <p className="text-gray-500 text-sm">Execute a query to see results here</p>
        </div>
      </div>
    );
    
  if (!result.ok)
    return (
      <div className="h-full p-6 bg-red-900/20 border border-red-500 rounded-lg text-red-300">
        <div className="flex items-center space-x-2 mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold">Error</h3>
        </div>
        <div className="font-mono text-sm bg-red-900/30 p-3 rounded-lg border border-red-800">
          {result.error || JSON.stringify(result)}
        </div>
      </div>
    );

  const rows = result.rows || [];
  const fields =
    rows.length > 0
      ? Object.keys(rows[0])
      : (result.fields || []).map((f) => f.name);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-700 sticky top-0">
                {fields.map((f, i) => (
                  <th 
                    key={i} 
                    className="border-r border-gray-600 px-4 py-3 text-left font-semibold text-gray-200 last:border-r-0 hover:bg-gray-650 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <span>{f}</span>
                      <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr 
                  key={ri} 
                  className="border-t border-gray-600 hover:bg-gray-750 transition-colors duration-150"
                >
                  {fields.map((f, fi) => (
                    <td 
                      key={fi} 
                      className="border-r border-gray-600 px-4 py-3 last:border-r-0"
                    >
                      <span className="text-gray-200 font-mono text-xs">
                        {String(r[f] ?? "").substring(0, 100)}
                        {String(r[f] ?? "").length > 100 ? "..." : ""}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            No data returned from query
          </div>
        )}
      </div>
      
      <div className="flex-shrink-0 p-4 border-t border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div>
            <span className="font-semibold text-blue-400">{result.rowCount}</span> rows •{" "}
            <span className="font-semibold text-green-400">{fields.length}</span> columns
          </div>
          <div>
            Query executed successfully
          </div>
        </div>
      </div>
    </div>
  );
}