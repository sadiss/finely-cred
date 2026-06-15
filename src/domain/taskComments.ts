export type TaskComment = {
  id: string;
  partnerId: string;
  taskId: string;
  authorType: 'admin' | 'partner';
  authorEmail?: string;
  body: string;
  createdAt: string;
};

