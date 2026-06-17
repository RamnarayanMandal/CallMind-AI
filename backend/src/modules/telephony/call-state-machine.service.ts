import { Injectable, Logger } from '@nestjs/common';

// ── State Enum ────────────────────────────────────────────────────────────────
export enum CallState {
  IDLE        = 'IDLE',
  LISTENING   = 'LISTENING',
  PROCESSING  = 'PROCESSING',
  SPEAKING    = 'SPEAKING',
  TERMINATED  = 'TERMINATED',
}

// Valid transitions map
const TRANSITIONS: Record<CallState, CallState[]> = {
  [CallState.IDLE]:       [CallState.LISTENING, CallState.TERMINATED],
  [CallState.LISTENING]:  [CallState.PROCESSING, CallState.TERMINATED],
  [CallState.PROCESSING]: [CallState.SPEAKING, CallState.LISTENING, CallState.TERMINATED],
  [CallState.SPEAKING]:   [CallState.LISTENING, CallState.TERMINATED],
  [CallState.TERMINATED]: [],
};

// ── Per-call instance ─────────────────────────────────────────────────────────
export class CallStateMachine {
  private state: CallState = CallState.IDLE;
  private pendingTasks     = 0;
  private resolveAllTasks: (() => void) | null = null;
  readonly abortController = new AbortController();
  private readonly logger  = new Logger('CallStateMachine');

  constructor(readonly callUuid: string) {}

  get currentState(): CallState {
    return this.state;
  }

  get signal(): AbortSignal {
    return this.abortController.signal;
  }

  // Attempt a state transition — throws if invalid
  transition(next: CallState): void {
    const allowed = TRANSITIONS[this.state];
    if (!allowed.includes(next)) {
      throw new Error(
        `[SM] Invalid transition ${this.state} → ${next} for call=${this.callUuid}`,
      );
    }
    this.logger.debug(`[SM] ${this.callUuid}: ${this.state} → ${next}`);
    this.state = next;
  }

  // Guard: throws if call is already terminated
  ensureAlive(): void {
    if (this.state === CallState.TERMINATED) {
      throw new Error(`[SM] Call ${this.callUuid} already TERMINATED — aborting pipeline`);
    }
  }

  // Abort all in-flight work (fires AbortSignal)
  abort(): void {
    if (this.state !== CallState.TERMINATED) {
      this.state = CallState.TERMINATED;
      this.abortController.abort();
      this.logger.debug(`[SM] ${this.callUuid}: aborted`);
    }
  }

  // Task counter — track in-flight async work after hangup
  incrementTasks(): void {
    this.pendingTasks++;
  }

  decrementTasks(): void {
    this.pendingTasks = Math.max(0, this.pendingTasks - 1);
    if (this.pendingTasks === 0 && this.resolveAllTasks) {
      this.resolveAllTasks();
      this.resolveAllTasks = null;
    }
  }

  // Wait until all pending tasks complete (used in hangup handler)
  waitForAllTasks(timeoutMs = 10_000): Promise<void> {
    if (this.pendingTasks === 0) return Promise.resolve();
    return new Promise((resolve) => {
      this.resolveAllTasks = resolve;
      setTimeout(() => {
        this.logger.warn(`[SM] ${this.callUuid}: waitForAllTasks timed out after ${timeoutMs}ms`);
        resolve();
      }, timeoutMs);
    });
  }
}

// ── Injectable Registry ───────────────────────────────────────────────────────
@Injectable()
export class CallStateMachineService {
  private readonly logger   = new Logger(CallStateMachineService.name);
  private readonly machines = new Map<string, CallStateMachine>();

  create(callUuid: string): CallStateMachine {
    const sm = new CallStateMachine(callUuid);
    this.machines.set(callUuid, sm);
    this.logger.debug(`[SM] Created machine for ${callUuid}`);
    return sm;
  }

  get(callUuid: string): CallStateMachine | undefined {
    return this.machines.get(callUuid);
  }

  getOrCreate(callUuid: string): CallStateMachine {
    return this.machines.get(callUuid) ?? this.create(callUuid);
  }

  delete(callUuid: string): void {
    this.machines.delete(callUuid);
    this.logger.debug(`[SM] Deleted machine for ${callUuid}`);
  }
}