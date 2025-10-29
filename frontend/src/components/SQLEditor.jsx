import React, { useRef, useState, useEffect } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { executeSQL, fixSQL, explainSQL, completeSQL } from "../api";

export default function SQLEditor({ workspaceId, onResult }) {
  const [sql, setSql] = useState("SELECT * FROM information_schema.tables;");
  const [status, setStatus] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [explanation, setExplanation] = useState("");
  const monaco = useMonaco();
  const editorRef = useRef(null);

  async function run() {
    if (!workspaceId) return setStatus("⚠️ Please select a workspace.");
    setIsRunning(true);
    setStatus("⏳ Running...");
    const res = await executeSQL(workspaceId, sql);
    if (res.ok) {
      setStatus("✅ Executed successfully");
      onResult && onResult(res.body);
    } else {
      setStatus("❌ " + (res.body.error || "Execution failed"));
    }
    setIsRunning(false);
  }

  async function handleFix() {
    setStatus("🔧 Fixing SQL...");
    const res = await fixSQL(sql);
    if (res.ok) setSql(res.body.fixed?.trim());
    setStatus("✅ Query optimized");
  }

  async function handleExplain() {
    setStatus("🧠 Generating explanation...");
    const res = await explainSQL(sql);
    if (res.ok) setExplanation(res.body.explanation);
    setStatus("💡 Explanation ready");
  }

  useEffect(() => {
    if (!monaco) return;

    monaco.languages.registerCompletionItemProvider("sql", {
      async provideCompletionItems(model, position) {
        const prefix = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        const res = await completeSQL(prefix);
        if (!res.ok) return;

        return {
          suggestions: [
            {
              label: res.body.suggestion.trim(),
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: res.body.suggestion.trim(),
              range: model.getWordUntilPosition(position),
            },
          ],
        };
      },
    });
  }, [monaco]);

  return (
    <div className="h-full flex flex-col bg-[#111]">
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-3 border-b border-gray-800 bg-[#141414]">
        <button onClick={run} disabled={isRunning}
          className="px-4 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm font-medium flex items-center gap-1">
          ▶ Run
        </button>

        <button onClick={handleFix}
          className="px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-sm">
          🔧 Fix
        </button>

        <button onClick={handleExplain}
          className="px-3 py-1.5 rounded-md bg-yellow-600 hover:bg-yellow-700 text-white text-sm">
          💡 Explain
        </button>

        {status && (
          <span className="ml-auto text-xs px-3 py-1.5 rounded-md bg-gray-800 text-gray-300 border border-gray-700">
            {status}
          </span>
        )}
      </div>

      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="sql"
          value={sql}
          onChange={setSql}
          theme="vs-dark"
          onMount={(editor) => (editorRef.current = editor)}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: "on",
            smoothScrolling: true,
            padding: { top: 12 },
            scrollBeyondLastLine: false,
            fontFamily: "'Fira Code', monospace",
          }}
        />
      </div>

      {explanation && (
        <div className="p-4 bg-gray-900 border-t border-gray-800 text-gray-200 text-sm whitespace-pre-wrap max-h-60 overflow-auto">
          <h3 className="font-semibold mb-2 text-yellow-300">💡 Explanation</h3>
          {explanation}
        </div>
      )}
    </div>
  );
}
