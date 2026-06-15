import { Handle, Position, type NodeProps } from '@xyflow/react';
import { GitBranch, Hourglass, Play, SplitSquareHorizontal, Target, Zap } from 'lucide-react';
import type { AutomationFlowNodeType } from '../../domain/automationStudio';
import { FINELY_OS_ENTITY_VALUE } from '../os/finelyOsLightUi';

const TYPE_META: Record<
  AutomationFlowNodeType,
  { icon: typeof Zap; badge: string; ring: string; chip: string }
> = {
  trigger: { icon: Zap, badge: 'Trigger', ring: 'ring-violet-500/45', chip: 'bg-violet-500/15 text-violet-200 border border-violet-500/25' },
  condition: { icon: SplitSquareHorizontal, badge: 'If', ring: 'ring-amber-500/45', chip: 'bg-amber-500/15 text-amber-100 border border-amber-500/25' },
  action: { icon: Play, badge: 'Action', ring: 'ring-emerald-500/45', chip: 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/25' },
  wait: { icon: Hourglass, badge: 'Wait', ring: 'ring-sky-500/45', chip: 'bg-sky-500/15 text-sky-200 border border-sky-500/25' },
  branch: { icon: GitBranch, badge: 'Branch', ring: 'ring-fuchsia-500/45', chip: 'bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-500/25' },
  goal: { icon: Target, badge: 'Goal', ring: 'ring-white/25', chip: 'bg-white/10 text-white/70 border border-white/[0.08]' },
};

export function AutomationFlowNode({ data, selected }: NodeProps) {
  const nodeType = (data.nodeType ?? 'action') as AutomationFlowNodeType;
  const meta = TYPE_META[nodeType] ?? TYPE_META.action;
  const Icon = meta.icon;
  const label = String(data.label ?? 'Step');

  return (
    <div
      className={`min-w-[200px] max-w-[240px] rounded-2xl border-2 border-white/[0.08] bg-fc-chrome/95 px-4 py-3 shadow-lg backdrop-blur-md transition-all ${
        selected ? `${meta.ring} ring-4 ring-offset-2 ring-offset-fc-shell` : ''
      }`}
    >
      {nodeType !== 'trigger' ? (
        <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-black/80" />
      ) : null}
      <div className="flex items-start gap-2">
        <div className={`mt-0.5 rounded-lg p-1.5 ${meta.chip}`}>
          <Icon size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <div className={`text-[9px] font-black uppercase tracking-widest ${meta.chip} inline-block px-1.5 py-0.5 rounded-md`}>
            {meta.badge}
          </div>
          <div className={`mt-1 text-sm font-semibold leading-snug break-words ${FINELY_OS_ENTITY_VALUE}`}>{label}</div>
        </div>
      </div>
      {nodeType !== 'goal' ? (
        <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-black/80" />
      ) : null}
    </div>
  );
}

export const automationFlowNodeTypes = { automation: AutomationFlowNode };
