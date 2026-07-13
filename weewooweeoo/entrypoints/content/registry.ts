export interface WheelAction {
  id: string;
  label: string;
}

export const REGISTRY: Record<string, WheelAction> = {
  explain: { id: 'explain', label: 'Explain' },
  summary: { id: 'summary', label: 'Summary' },
  search:  { id: 'search',  label: 'Search' },
  task:    { id: 'task',    label: 'Task' },
};
