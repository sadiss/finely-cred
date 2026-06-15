import { useCallback, useEffect, useMemo, useState } from 'react';
import { Background, Controls, MiniMap, Panel, ReactFlow, addEdge, useEdgesState, useNodesState, type Connection, type Edge, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GitBranch, Hourglass, Play, Plus, Save, SplitSquareHorizontal, Target, Trash2, Zap } from 'lucide-react';
import type { AutomationFlowGraph, AutomationRule, AutomationTrigger } from '../../domain/automationStudio';
import { AUTOMATION_TRIGGER_CATALOG } from './automationTriggerCatalog';
import {
  FLOW_NODE_PALETTE,
  addFlowNodeAt,
  applyTriggerToFlow,
  flowGraphToRulePatch,
  ruleToFlowGraph,
  triggerLabel,
} from './automationFlowModel';
import { automationFlowNodeTypes } from './AutomationFlowNode';
import {
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_DANGER_BTN,
  FINELY_OS_TOOLBAR,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

const BLOCK_ICONS = {
  condition: SplitSquareHorizontal,
  action: Play,
  wait: Hourglass,
  branch: GitBranch,
  goal: Target,
} as const;

function flowNodeToRf(n: AutomationFlowGraph['nodes'][number]): Node {
  return {
    id: n.id,
    type: 'automation',
    position: n.position,
    data: { label: n.label, nodeType: n.type, payload: n.data },
  };
}

function rfToFlowGraph(nodes: Node[], edges: Edge[]): AutomationFlowGraph {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: (n.data as { nodeType?: string })?.nodeType ?? 'action',
      label: String((n.data as { label?: string })?.label ?? n.id),
      data: (n.data as { payload?: Record<string, unknown> })?.payload ?? {},
      position: n.position,
    })) as AutomationFlowGraph['nodes'],
    edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, label: e.label ? String(e.label) : undefined })),
  };
}

type Props = {
  rule: AutomationRule;
  onRuleChange: (next: AutomationRule) => void;
  onDelete?: (id: string) => void;
  height?: number;
};

export function AutomationStudioShell({ rule, onRuleChange, onDelete, height = 680 }: Props) {
  const initial = useMemo(() => ruleToFlowGraph(rule), [rule.id, rule.updatedAt]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes.map(flowNodeToRf));
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    const g = ruleToFlowGraph(rule);
    setNodes(g.nodes.map(flowNodeToRf));
    setEdges(g.edges);
    setSelectedNodeId(null);
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

  const addNode = useCallback(
    (type: (typeof FLOW_NODE_PALETTE)[number]['type']) => {
      const flow = rfToFlowGraph(nodes, edges);
      const nextFlow = addFlowNodeAt(flow, type);
      const nextNodes = nextFlow.nodes.map(flowNodeToRf);
      setNodes(nextNodes);
      persist(nextNodes, edges);
    },
    [nodes, edges, persist, setNodes],
  );

  const applyTrigger = useCallback(
    (trigger: AutomationTrigger) => {
      const flow = rfToFlowGraph(nodes, edges);
      const nextFlow = applyTriggerToFlow(flow, trigger);
      const nextNodes = nextFlow.nodes.map(flowNodeToRf);
      setNodes(nextNodes);
      persist(nextNodes, edges);
    },
    [nodes, edges, persist, setNodes],
  );

  const removeSelected = useCallback(() => {
    if (!selectedNodeId || selectedNodeId === 'trigger_0') return;
    const nextNodes = nodes.filter((n) => n.id !== selectedNodeId);
    const nextEdges = edges.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId);
    setNodes(nextNodes);
    setEdges(nextEdges);
    setSelectedNodeId(null);
    persist(nextNodes, nextEdges);
  }, [selectedNodeId, nodes, edges, persist, setNodes, setEdges]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="space-y-4">
      <div className={FINELY_OS_TOOLBAR}>
        <div className="flex flex-wrap items-center gap-3 min-w-0 flex-1">
          <div className={`inline-flex items-center gap-2 text-sm font-semibold shrink-0 ${FINELY_OS_ENTITY_VALUE}`}>
            <Zap size={16} className="text-fuchsia-400" />
            {rule.name}
          </div>
          <span className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono shrink-0`}>{triggerLabel(rule.trigger)}</span>
          {selectedNode ? (
            <span className={`text-xs truncate ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
              Selected: <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{String(selectedNode.data.label)}</span>
            </span>
          ) : (
            <span className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>Connect nodes via handles • drag to reposition</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button type="button" onClick={() => persist(nodes, edges)} className={FINELY_OS_PRIMARY_BTN}>
            <Save size={14} /> Save flow
          </button>
          {selectedNodeId && selectedNodeId !== 'trigger_0' ? (
            <button type="button" onClick={removeSelected} className={FINELY_OS_DANGER_BTN}>
              <Trash2 size={14} /> Remove step
            </button>
          ) : null}
          {onDelete ? (
            <button type="button" onClick={() => onDelete(rule.id)} className={FINELY_OS_SECONDARY_BTN}>
              Delete rule
            </button>
          ) : null}
        </div>
      </div>

      <div className={`space-y-3 ${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
        <div>
          <div className={FINELY_OS_ENTITY_LABEL}>Triggers — click to set start node</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {AUTOMATION_TRIGGER_CATALOG.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTrigger(t.sample)}
                className="fc-light-glass-panel fc-light-chrome-panel rounded-xl px-3 py-2 text-left hover:border-violet-500/30 hover:bg-violet-500/[0.08] transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{t.label}</span>
                  <span className={finelyOsStatusChip(t.tier === 'live' ? 'ok' : 'warn')}>{t.tier}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className={FINELY_OS_ENTITY_LABEL}>Add flow blocks</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {FLOW_NODE_PALETTE.filter((p) => p.type !== 'trigger').map((p) => {
              const Icon = BLOCK_ICONS[p.type as keyof typeof BLOCK_ICONS] ?? Plus;
              return (
                <button
                  key={p.type}
                  type="button"
                  onClick={() => addNode(p.type)}
                  className="inline-flex items-center gap-2 fc-light-glass-panel fc-light-chrome-panel rounded-xl px-3 py-2 hover:border-fuchsia-500/30 hover:bg-fuchsia-500/[0.08] transition-all"
                >
                  <Icon size={14} className="text-fuchsia-400" />
                  <span className={`text-xs font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl border-2 border-white/[0.08] overflow-hidden bg-gradient-to-br from-violet-950/40 via-fc-shell to-emerald-950/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_32px_rgba(0,0,0,0.45)]"
        style={{ height }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={automationFlowNodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={(_, n) => setSelectedNodeId(n.id)}
          onPaneClick={() => setSelectedNodeId(null)}
          defaultEdgeOptions={{ animated: true, style: { stroke: '#7c3aed', strokeWidth: 2 } }}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          minZoom={0.4}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={24} color="#334155" />
          <MiniMap pannable zoomable zoomStep={0.5} nodeStrokeWidth={2} className="!bg-fc-chrome/90 !border-white/[0.08]" />
          <Controls showInteractive className="!bg-fc-chrome/95 !border-white/[0.08] !shadow-md [&>button]:!bg-fc-chrome/80 [&>button]:!border-white/[0.08] [&>button]:!text-white/70" />
          <Panel position="top-center" className="!mt-3">
            <div className="rounded-full border border-fuchsia-500/25 bg-fc-chrome/95 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-fuchsia-200 shadow-sm backdrop-blur-md">
              Automation canvas — GHL-style visual builder
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
