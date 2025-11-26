import { useCallback, useMemo, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";

export default function StoryTree({ pages, startPageId, onPageSelect }) {
  // Calculer nodes et edges
  const { graphNodes, graphEdges } = useMemo(() => {
    if (!pages || pages.length === 0) return { graphNodes: [], graphEdges: [] };

    const pageMap = new Map(pages.map((p) => [p._id, p]));

    // BFS pour calculer les niveaux
    const levels = new Map();
    const visited = new Set();
    const queue = [[startPageId || pages[0]?._id, 0]];

    while (queue.length > 0) {
      const [pageId, level] = queue.shift();
      if (!pageId || visited.has(pageId)) continue;
      visited.add(pageId);
      levels.set(pageId, level);

      const page = pageMap.get(pageId);
      page?.choices?.forEach((choice) => {
        if (!visited.has(choice.targetPageId)) {
          queue.push([choice.targetPageId, level + 1]);
        }
        if (choice.failurePageId && !visited.has(choice.failurePageId)) {
          queue.push([choice.failurePageId, level + 1]);
        }
      });
    }

    // Pages orphelines
    pages.forEach((p) => {
      if (!levels.has(p._id)) levels.set(p._id, -1);
    });

    // Grouper par niveau
    const levelGroups = new Map();
    levels.forEach((level, pageId) => {
      if (!levelGroups.has(level)) levelGroups.set(level, []);
      levelGroups.get(level).push(pageId);
    });

    // Créer les nodes
    const graphNodes = pages.map((page) => {
      const level = levels.get(page._id) ?? 0;
      const group = levelGroups.get(level) || [];
      const indexInGroup = group.indexOf(page._id);
      const groupSize = group.length;

      const x = (indexInGroup - (groupSize - 1) / 2) * 200;
      const y = level === -1 ? -150 : level * 150;

      const isStart = page._id === startPageId;
      const isEnd = page.isEnd;
      const isOrphan = level === -1;

      return {
        id: page._id,
        position: { x, y },
        data: {
          label: page.content?.substring(0, 30) + "..." || "Page vide",
          page,
          isStart,
          isEnd,
          isOrphan,
        },
        style: {
          background: isOrphan
            ? "#fef3c7"
            : isStart
            ? "#d1fae5"
            : isEnd
            ? "#fee2e2"
            : "#f3f4f6",
          border: `2px solid ${
            isOrphan
              ? "#f59e0b"
              : isStart
              ? "#10b981"
              : isEnd
              ? "#ef4444"
              : "#9ca3af"
          }`,
          borderRadius: "8px",
          padding: "10px",
          fontSize: "12px",
          width: 150,
          cursor: "pointer",
        },
      };
    });

    // Créer les edges
    const graphEdges = [];
    pages.forEach((page) => {
      page.choices?.forEach((choice, index) => {
        graphEdges.push({
          id: `${page._id}-${choice.targetPageId}-${index}`,
          source: page._id,
          target: choice.targetPageId,
          label: choice.text?.substring(0, 15) + "...",
          labelStyle: { fontSize: 10 },
          style: {
            stroke: choice.diceRequired ? "#f59e0b" : "#6b7280",
            strokeWidth: 2,
          },
          animated: choice.diceRequired,
          markerEnd: { type: "arrowclosed" },
        });

        if (choice.diceRequired && choice.failurePageId) {
          graphEdges.push({
            id: `${page._id}-${choice.failurePageId}-fail-${index}`,
            source: page._id,
            target: choice.failurePageId,
            label: "Échec",
            labelStyle: { fontSize: 10, fill: "#ef4444" },
            style: {
              stroke: "#ef4444",
              strokeWidth: 2,
              strokeDasharray: "5,5",
            },
            markerEnd: { type: "arrowclosed" },
          });
        }
      });
    });

    return { graphNodes, graphEdges };
  }, [pages, startPageId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(graphNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphEdges);

  // Sync quand les données changent
  useEffect(() => {
    setNodes(graphNodes);
    setEdges(graphEdges);
  }, [graphNodes, graphEdges, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_, node) => {
      if (onPageSelect && node.data.page) {
        onPageSelect(node.data.page);
      }
    },
    [onPageSelect]
  );

  if (!pages || pages.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-500">Aucune page à afficher</p>
      </div>
    );
  }

  return (
    <div className="h-[500px] border border-gray-200 rounded-lg overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="#e5e7eb" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) =>
            node.data.isOrphan
              ? "#fbbf24"
              : node.data.isStart
              ? "#34d399"
              : node.data.isEnd
              ? "#f87171"
              : "#9ca3af"
          }
          maskColor="rgba(0,0,0,0.1)"
        />
      </ReactFlow>
    </div>
  );
}
