import { describe, it, expect } from 'vitest';
import { ExecutionPipeline } from '../src/core/engine';

describe('ExecutionPipeline', () => {
  it('orders high priority tasks ahead of normal tasks', () => {
    const pipeline = new ExecutionPipeline();
    pipeline.enqueue({ id: 't-1', priority: 'normal', command: 'npm run lint', retries: 0 });
    pipeline.enqueue({ id: 't-2', priority: 'high', command: 'npm test', retries: 1 });

    expect(pipeline.dequeue()?.id).toBe('t-2');
    expect(pipeline.dequeue()?.id).toBe('t-1');
  });
});
