import { ExecutionPipeline, TaskPayload } from './engine';

export interface RouteResponse {
  accepted: boolean;
  queueDepth: number;
  taskId: string;
}

export class RequestRouter {
  private pipeline = new ExecutionPipeline();

  public dispatch(payload: TaskPayload): RouteResponse {
    const depth = this.pipeline.enqueue(payload);
    return {
      accepted: true,
      queueDepth: depth,
      taskId: payload.id,
    };
  }

  public nextTask(): TaskPayload | undefined {
    return this.pipeline.dequeue();
  }
}
