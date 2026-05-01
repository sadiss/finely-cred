export type EntityKind =
  | 'partner'
  | 'project'
  | 'task'
  | 'letter'
  | 'evidence'
  | 'report'
  | 'dispute'
  | 'case'
  | 'comms'
  | 'course'
  | 'media';

export type EntityRef = {
  kind: EntityKind;
  id: string;
  label?: string;
};

