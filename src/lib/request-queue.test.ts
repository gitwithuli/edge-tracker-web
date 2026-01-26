import { describe, it, expect, beforeEach, vi } from 'vitest';
import { enqueue, dequeue, getQueue, type QueuedOperation } from './request-queue';

describe('request-queue', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('enqueue', () => {
    it('adds operation to queue and returns id', () => {
      const id = enqueue({ type: 'addLog', payload: { edgeId: '123' } });
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
    });

    it('stores operation in localStorage', () => {
      enqueue({ type: 'addLog', payload: { data: 'test' } });
      const queue = getQueue();
      expect(queue.length).toBe(1);
      expect(queue[0].type).toBe('addLog');
    });

    it('generates unique ids', () => {
      const id1 = enqueue({ type: 'addLog', payload: {} });
      const id2 = enqueue({ type: 'addLog', payload: {} });
      expect(id1).not.toBe(id2);
    });
  });

  describe('dequeue', () => {
    it('removes operation from queue', () => {
      const id = enqueue({ type: 'addLog', payload: {} });
      expect(getQueue().length).toBe(1);

      dequeue(id);
      expect(getQueue().length).toBe(0);
    });

    it('does nothing for non-existent id', () => {
      enqueue({ type: 'addLog', payload: {} });
      dequeue('non-existent-id');
      expect(getQueue().length).toBe(1);
    });
  });

  describe('getQueue', () => {
    it('returns empty array when no operations', () => {
      expect(getQueue()).toEqual([]);
    });

    it('returns all queued operations', () => {
      enqueue({ type: 'addLog', payload: { a: 1 } });
      enqueue({ type: 'updateLog', payload: { b: 2 } });

      const queue = getQueue();
      expect(queue.length).toBe(2);
    });

    it('handles corrupted localStorage gracefully', () => {
      localStorage.setItem('edge-tracker-queue', 'not valid json');
      expect(getQueue()).toEqual([]);
    });
  });
});
