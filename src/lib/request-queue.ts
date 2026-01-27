/**
 * Request Queue System
 *
 * Handles Chrome's tab throttling by queuing operations locally
 * and retrying when the tab becomes active.
 *
 * How it works:
 * 1. Operations are saved to localStorage immediately (survives refresh)
 * 2. When tab becomes visible, pending operations are retried
 * 3. Successful operations are removed from queue
 * 4. Failed operations stay in queue for next retry
 */

export interface QueuedOperation {
  id: string;
  type: 'addLog' | 'updateLog' | 'deleteLog' | 'addEdge' | 'updateEdge' | 'deleteEdge';
  payload: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
}

const QUEUE_KEY = 'edge-tracker-pending-ops';
const MAX_RETRIES = 5;
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

// Get current queue from localStorage
export function getQueue(): QueuedOperation[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(QUEUE_KEY);
    if (!stored) return [];
    const queue = JSON.parse(stored) as QueuedOperation[];
    // Filter out expired operations
    const now = Date.now();
    return queue.filter(op => now - op.createdAt < MAX_AGE_MS);
  } catch {
    return [];
  }
}

// Save queue to localStorage
function saveQueue(queue: QueuedOperation[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to save queue:', e);
  }
}

// Add operation to queue
export function enqueue(op: Omit<QueuedOperation, 'id' | 'createdAt' | 'retryCount'>): string {
  const id = `op-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const queue = getQueue();
  queue.push({
    ...op,
    id,
    createdAt: Date.now(),
    retryCount: 0,
  });
  saveQueue(queue);
  return id;
}

// Remove operation from queue (on success)
export function dequeue(id: string): void {
  const queue = getQueue();
  saveQueue(queue.filter(op => op.id !== id));
}

// Mark operation as retried (increment retry count)
export function markRetried(id: string): boolean {
  const queue = getQueue();
  const op = queue.find(o => o.id === id);
  if (!op) return false;

  op.retryCount++;
  if (op.retryCount >= MAX_RETRIES) {
    // Remove after max retries
    saveQueue(queue.filter(o => o.id !== id));
    return false; // Don't retry anymore
  }

  saveQueue(queue);
  return true; // Can retry
}

// Check if there are pending operations
export function hasPendingOperations(): boolean {
  return getQueue().length > 0;
}
