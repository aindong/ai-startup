export type AgentState =
  | 'IDLE'
  | 'WORKING'
  | 'COLLABORATING'
  | 'BREAK'
  | 'THINKING';

export type AgentAction =
  | 'START_TASK'
  | 'COMPLETE_TASK'
  | 'REQUEST_HELP'
  | 'PROVIDE_HELP'
  | 'TAKE_BREAK'
  | 'RESUME_WORK'
  | 'MAKE_DECISION';

export interface AgentStateTransition {
  from: AgentState;
  to: AgentState;
  action: AgentAction;
  conditions?: Array<(agent: any) => boolean>; // Will be typed properly with Agent interface
}

export interface AgentDecision {
  id: string;
  agentId: string;
  type: 'TASK_RELATED' | 'COLLABORATION' | 'BREAK_TIME';
  context: {
    taskId?: string;
    collaboratorIds?: string[];
    reason?: string;
  };
  options: Array<{
    id: string;
    description: string;
    impact: number; // -1 to 1, representing negative to positive impact
    confidence: number; // 0 to 1
  }>;
  selectedOption?: string;
  createdAt: Date;
  decidedAt?: Date;
}

export interface AgentBehaviorMetrics {
  productivity: number; // 0 to 1
  collaboration: number; // 0 to 1
  decisionQuality: number; // 0 to 1
  taskCompletionRate: number; // 0 to 1
  breakTimeEfficiency: number; // 0 to 1
}
