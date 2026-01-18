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

// Get pending operations of a specific type
export function getPendingByType(type: QueuedOperation['type']): QueuedOperation[] {
  return getQueue().filter(op => op.type === type);
}

// Check if there are pending operations
export function hasPendingOperations(): boolean {
  return getQueue().length > 0;
}

// Clear all pending operations (use with caution)
export function clearQueue(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(QUEUE_KEY);
}

/**
 * Visibility-aware processor
 * Call this once on app init to set up automatic retry on tab focus
 */
export function setupVisibilityProcessor(
  processQueue: () => Promise<void>
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && hasPendingOperations()) {
      console.log('[Queue] Tab visible, processing pending operations...');
      processQueue();
    }
  };

  // Process on visibility change
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Also process on window focus (backup)
  window.addEventListener('focus', () => {
    if (hasPendingOperations()) {
      processQueue();
    }
  });

  // Process immediately if there are pending ops on init
  if (hasPendingOperations()) {
    setTimeout(processQueue, 1000); // Delay to let app initialize
  }

  // Return cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}

/**
 * Wrapper for async operations with queue support
 *
 * Usage:
 * const result = await withQueue(
 *   'addLog',
 *   { edgeId, logData },
 *   async () => await supabase.from('logs').insert(...)
 * );
 */
export async function withQueue<T>(
  type: QueuedOperation['type'],
  payload: Record<string, unknown>,
  operation: () => Promise<T>,
  onQueued?: () => void
): Promise<{ success: boolean; data?: T; queued?: boolean; error?: string }> {
  const opId = enqueue({ type, payload });

  try {
    const data = await operation();
    dequeue(opId); // Success - remove from queue
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Check if it's a throttling/network issue (worth retrying)
    const isRetryable =
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('Failed to fetch');

    if (isRetryable) {
      console.log(`[Queue] Operation ${type} queued for retry:`, message);
      onQueued?.();
      return { success: false, queued: true, error: message };
    }

    // Not retryable - remove from queue and report error
    dequeue(opId);
    return { success: false, queued: false, error: message };
  }
}
