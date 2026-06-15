import { useCallback, useEffect, useMemo } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { AutomationFlowGraph, AutomationFlowNodeType } from '../../domain/automationStudio';
import { flowGraphToRulePatch, ruleToFlowGraph } from './automationFlowModel';
import type { AutomationRule } from '../../domain/automationStudio';

const NODE_STYLES: Record<AutomationFlowNodeType, string> = {
  trigger: 'border-violet-400 bg-gradient-to-br from-violet-100/90 to-white',
  condition: 'border-amber-400 bg-gradient-to-br from-amber-100/90 to-white',
  action: 'border-emerald-400 bg-gradient-to-br from-emerald-100/90 to-white',
  wait: 'border-sky-400 bg-gradient-to-br from-sky-100/90 to-white',
  branch: 'border-fuchsia-400 bg-gradient-to-br from-fuchsia-100/90 to-white',
  goal: 'border-slate-400 bg-gradient-to-br from-slate-100/90 to-white',
};

function flowNodeToRf(n: AutomationFlowGraph['nodes'][number]): Node {
  return {
    id: n.id,
    type: 'default',
    position: n.position,
    data: { label: n.label, nodeType: n.type, payload: n.data },
    style: {
      borderWidth: 2,
      borderRadius: 16,
      padding: 12,
      minWidth: 180,
      fontSize: 12,
      fontWeight: 600,
    },
    className: NODE_STYLES[n.type] ?? NODE_STYLES.action,
  };
}

function rfToFlowGraph(nodes: Node[], edges: Edge[]): AutomationFlowGraph {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: (n.data as any)?.nodeType ?? 'action',
      label: String((n.data as any)?.label ?? n.id),
      data: (n.data as { payload?: Record<string, unknown> })?.payload ?? {},
      position: n.position,
    })),
    edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, label: e.label ? String(e.label) : undefined })),
  };
}

type Props = {
  rule: AutomationRule;
  onRuleChange: (next: AutomationRule) => void;
  height?: number;
};

export function AutomationFlowCanvas({ rule, onRuleChange, height = 420 }: Props) {
  const initial = useMemo(() => ruleToFlowGraph(rule), [rule.id, rule.updatedAt]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes.map(flowNodeToRf));
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);

  useEffect(() => {
    const g = ruleToFlowGraph(rule);
    setNodes(g.nodes.map(flowNodeToRf));
    setEdges(g.edges);
  }, [rule.id, rule.updatedAt, setNodes, setEdges]);

  const persist = useCallback(
    (nextNodes: Node[], nextEdges: Edge[]) => {
      const flow = rfToFlowGraph(nextNodes, nextEdges);
      const patch = flowGraphToRulePatch(flow);
      onRuleChange({ ...rule, ...patch, flow, updatedAt: new Date().toISOString() });
    },
    [onRuleChange, rule],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => {
        const next = addEdge(connection, eds);
        persist(nodes, next);
        return next;
      });
    },
    [nodes, persist, setEdges],
  );

  const onNodeDragStop = useCallback(() => {
    persist(nodes, edges);
  }, [nodes, edges, persist]);

  return (
    <div className="rounded-2xl border border-violet-200/60 overflow-hidden bg-gradient-to-br from-violet-50/20 via-white to-sky-50/20" style={{ height }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        defaultEdgeOptions={{ animated: true, style: { stroke: '#8b5cf6' } }}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} color="#c4b5fd" />
        <MiniMap pannable zoomable />
        <Controls />
      </ReactFlow>
    </div>
  );
}
