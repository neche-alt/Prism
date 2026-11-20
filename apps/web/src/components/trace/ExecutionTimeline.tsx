"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import ReplayProgressBar from "./ReplayProgressBar";

interface ExecutionTimelineProps {
  nodes: any[];
  resourceProfile?: {
    read_bytes: number;
    read_limit: number;
    write_bytes: number;
    write_limit: number;
  };
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.25;

export function ExecutionTimeline({
  nodes,
  resourceProfile,
}: ExecutionTimelineProps) {
  const [zoom, setZoom] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [minimapOpen, setMinimapOpen] = useState(true);
  const [viewport, setViewport] = useState({
    scrollTop: 0,
    clientHeight: 1,
    scrollHeight: 1,
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const isApproachingReadLimit =
    resourceProfile &&
    resourceProfile.read_limit > 0 &&
    resourceProfile.read_bytes / resourceProfile.read_limit > 0.9;
  const isApproachingWriteLimit =
    resourceProfile &&
    resourceProfile.write_limit > 0 &&
    resourceProfile.write_bytes / resourceProfile.write_limit > 0.9;

  // Keep the selected index in range as the node set changes.
  useEffect(() => {
    if (nodes.length === 0) {
      setSelectedIndex(0);
    } else if (selectedIndex > nodes.length - 1) {
      setSelectedIndex(nodes.length - 1);
    }
  }, [nodes.length, selectedIndex]);

  function scrollToIndex(index: number) {
    const el = itemRefs.current[index];
    if (el) el.scrollIntoView({ block: "nearest" });
  }

  function selectNode(index: number) {
    if (nodes.length === 0) return;
    const clamped = Math.max(0, Math.min(index, nodes.length - 1));
    setSelectedIndex(clamped);
    scrollToIndex(clamped);
  }

  function zoomIn() {
    setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM));
  }
  function zoomOut() {
    setZoom((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM));
  }
  function fitToView() {
    setZoom(1);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setSelectedIndex(0);
  }

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setViewport({
      scrollTop: el.scrollTop,
      clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight || 1,
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (nodes.length === 0) return;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      selectNode(selectedIndex + 1);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      selectNode(selectedIndex - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      selectNode(0);
    } else if (e.key === "End") {
      e.preventDefault();
      selectNode(nodes.length - 1);
    }
  }

  const viewportTop = (viewport.scrollTop / viewport.scrollHeight) * 100;
  const viewportHeight = (viewport.clientHeight / viewport.scrollHeight) * 100;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-semibold">Execution Timeline</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {(isApproachingReadLimit || isApproachingWriteLimit) && (
            <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full flex items-center">
              <span className="mr-1">⚠️</span>
              Storage IO Warning (Approaching limit)
            </span>
          )}
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
            <button
              type="button"
              onClick={zoomOut}
              aria-label="Zoom out"
              className="px-2 py-1 text-sm rounded hover:bg-gray-100"
            >
              −
            </button>
            <span className="text-xs w-10 text-center tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={zoomIn}
              aria-label="Zoom in"
              className="px-2 py-1 text-sm rounded hover:bg-gray-100"
            >
              +
            </button>
            <button
              type="button"
              onClick={fitToView}
              className="px-2 py-1 text-xs rounded hover:bg-gray-100"
            >
              Fit
            </button>
            <button
              type="button"
              onClick={() => setMinimapOpen((o) => !o)}
              className="px-2 py-1 text-xs rounded hover:bg-gray-100"
            >
              {minimapOpen ? "Hide minimap" : "Show minimap"}
            </button>
          </div>
        </div>
      </div>

      <ReplayProgressBar
        current={selectedIndex}
        total={nodes.length}
        onSeek={selectNode}
      />

      <div className="flex gap-4 mt-4">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="listbox"
          aria-label="Execution timeline nodes"
          className="flex-1 overflow-y-auto overflow-x-hidden max-h-[28rem] border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {nodes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No trace nodes yet. Waiting for trace data...
            </p>
          ) : (
            <div
              style={{ zoom } as unknown as CSSProperties}
              className="space-y-2"
            >
              {nodes.map((node, idx) => (
                <div
                  key={idx}
                  ref={(el) => {
                    itemRefs.current[idx] = el;
                  }}
                  onClick={() => selectNode(idx)}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    idx === selectedIndex
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-mono text-gray-500">
                        #{idx}
                      </span>
                      <span className="font-mono text-sm">
                        {node.node?.event_type || "Unknown"}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      Path: {node.path?.join(" → ") || "root"}
                    </span>
                  </div>
                  {node.node?.data && (
                    <pre className="mt-2 text-xs text-gray-600 overflow-x-auto">
                      {JSON.stringify(node.node.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {minimapOpen && nodes.length > 0 && (
          <div className="w-28 shrink-0 border border-gray-200 rounded-lg p-2 bg-gray-50">
            <div className="text-xs text-gray-500 mb-1">Minimap</div>
            <div className="relative h-[26rem] flex flex-col gap-px overflow-hidden">
              {nodes.map((node, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectNode(idx)}
                  title={node.node?.event_type || "Unknown"}
                  aria-label={`Jump to node ${idx + 1}`}
                  className={`flex-1 min-h-0 w-full rounded ${
                    idx === selectedIndex ? "bg-blue-600" : "bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
              {/* Current viewport highlight */}
              <div
                className="absolute left-0 right-0 border-2 border-blue-500/60 bg-blue-200/20 pointer-events-none rounded"
                style={{ top: `${viewportTop}%`, height: `${viewportHeight}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExecutionTimeline;
