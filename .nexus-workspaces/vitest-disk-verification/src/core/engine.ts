export interface TaskPayload {
  id: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  command: string;
  retries: number;
  timeoutMs?: number;
}

export class ExecutionPipeline {
  private queue: TaskPayload[] = [];

  public enqueue(task: TaskPayload): number {
    if (!task.command.trim()) {
      throw new Error('Task command cannot be empty');
    }
    this.queue.push(task);
    this.queue.sort((a, b) => this.rank(b.priority) - this.rank(a.priority));
    return this.queue.length;
  }

  public dequeue(): TaskPayload | undefined {
    return this.queue.shift();
  }

  public peek(): TaskPayload | undefined {
    return this.queue[0];
  }

  public size(): number {
    return this.queue.length;
  }

  private rank(priority: TaskPayload['priority']): number {
    switch (priority) {
      case 'critical':
        return 4;
      case 'high':
        return 3;
      case 'normal':
        return 2;
      default:
        return 1;
    }
  }
}
