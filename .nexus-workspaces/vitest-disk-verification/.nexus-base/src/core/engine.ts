export interface TaskPayload {
  id: string;
  priority: 'low' | 'normal' | 'high';
  command: string;
  retries: number;
}

export class ExecutionPipeline {
  private queue: TaskPayload[] = [];

  public enqueue(task: TaskPayload): number {
    this.queue.push(task);
    this.queue.sort((a, b) => this.rank(b.priority) - this.rank(a.priority));
    return this.queue.length;
  }

  public dequeue(): TaskPayload | undefined {
    return this.queue.shift();
  }

  public size(): number {
    return this.queue.length;
  }

  private rank(priority: TaskPayload['priority']): number {
    switch (priority) {
      case 'high':
        return 3;
      case 'normal':
        return 2;
      default:
        return 1;
    }
  }
}
