// Counters shared by the fakes and worker.ts
export const counters = {
  gmailListCalls: 0,
  gmailGetCalls: 0,
  llmCalls: 0,
  /** time spent generating fake mailboxes (harness cost, not app work) */
  fakeSourceMs: 0,
};

export type Counters = typeof counters;
