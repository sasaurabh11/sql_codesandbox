import React, { useState, useRef, useEffect } from 'react'
import WorkspaceManager from './components/WorkspaceManager'
import SchemaBuilder from './components/SchemaBuilder'
import SQLEditor from './components/SQLEditor'
import ResultViewer from './components/ResultViewer'

export default function App() {
  const [workspaceId, setWorkspaceId] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [activeSection, setActiveSection] = useState('editor'); 
  const [panelWidth, setPanelWidth] = useState(50); 
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  const handleMouseDown = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isResizing || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const mouseX = e.clientX - containerRect.left;
    const newWidth = (mouseX / containerWidth) * 100;

    const boundedWidth = Math.max(10, Math.min(90, newWidth));
    setPanelWidth(boundedWidth);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8 py-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                SQL SandBox
              </h1>
              <p className="text-sm text-gray-400">Interactive SQL Playground</p>
            </div>
          </div>
        </header>

        <WorkspaceManager onWorkspaceSet={setWorkspaceId} />

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6 p-1 bg-gray-800 rounded-xl w-fit mx-auto">
          <button
            className={`px-6 py-3 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
              activeSection === 'editor' 
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg" 
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
            onClick={() => setActiveSection('editor')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>SQL Editor & Results</span>
          </button>
          <button
            className={`px-6 py-3 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
              activeSection === 'schema' 
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg" 
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
            onClick={() => setActiveSection('schema')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Schema Builder</span>
          </button>
        </div>

        {activeSection === 'editor' ? (
          <div 
            ref={containerRef}
            className="flex h-[600px] bg-gray-800 rounded-xl border border-gray-700 overflow-hidden relative"
          >
            {/* SQL Editor Panel */}
            <div 
              className="h-full flex flex-col transition-all duration-150"
              style={{ width: `${panelWidth}%` }}
            >
              <div className="flex-shrink-0 p-4 border-b border-gray-700 bg-gray-800">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-white">SQL Editor</h3>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <SQLEditor workspaceId={workspaceId} onResult={(r) => setLastResult(r)} />
              </div>
            </div>

            {/* Resize Handle */}
            <div
              className={`w-2 bg-gray-600 hover:bg-blue-500 cursor-col-resize transition-colors relative z-10 ${
                isResizing ? 'bg-blue-500' : ''
              }`}
              onMouseDown={handleMouseDown}
            >
              <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-1 bg-gray-400 opacity-50"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="flex flex-col space-y-1">
                  <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Results Panel */}
            <div 
              className="h-full flex flex-col transition-all duration-150"
              style={{ width: `${100 - panelWidth}%` }}
            >
              <div className="flex-shrink-0 p-4 border-b border-gray-700 bg-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-white">Query Results</h3>
                  </div>
                  {lastResult && (
                    <div className="text-sm text-gray-400">
                      {lastResult.ok ? (
                        <span className="text-green-400">
                          {lastResult.rowCount} row{lastResult.rowCount !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-red-400">Error</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-auto">
                <ResultViewer result={lastResult} />
              </div>
            </div>

            {isResizing && (
              <div className="absolute inset-0 bg-transparent z-20 cursor-col-resize" />
            )}
          </div>
        ) : (
          <div>
            <SchemaBuilder workspaceId={workspaceId} onSaved={w => console.log('saved', w)} />
          </div>
        )}
      </div>
    </div>
  )
}