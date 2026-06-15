import type { TaskComment } from '../domain/taskComments';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';

const KEY = 'finely.task_comments.v1';
const VERSION = 1;

type Store = { comments: TaskComment[] };

function nowIso() {
  return new Date().toISOString();
}

function loadStore(): Store {
  return loadJson<Store>(KEY, { comments: [] }, VERSION);
}

function saveStore(store: Store) {
  saveJson(KEY, store, VERSION);
}

export function listCommentsByTask(taskId: string): TaskComment[] {
  const store = loadStore();
  return store.comments
    .filter((c) => c.taskId === taskId)
    .slice()
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
}

export function addTaskComment(args: Omit<TaskComment, 'id' | 'createdAt'>): TaskComment {
  const store = loadStore();
  const c: TaskComment = { ...args, id: newId('task_comment'), createdAt: nowIso() };
  store.comments.push(c);
  saveStore(store);
  return c;
}

export function deleteTaskComment(id: string): boolean {
  const store = loadStore();
  const idx = store.comments.findIndex((c) => c.id === id);
  if (idx < 0) return false;
  store.comments.splice(idx, 1);
  saveStore(store);
  return true;
}

