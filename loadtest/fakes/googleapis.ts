// Minimal fake of the googleapis package: only what gmail.ts uses (OAuth2,
// users.messages.list and users.messages.get), backed by mailbox.ts.
import { performance } from "node:perf_hooks";
import { counters } from "./state.ts";
import {
  generateMailbox,
  loadConfigFromEnv,
  userIndexFromRefreshToken,
  type SyntheticMessage,
} from "../mailbox.ts";

const cfg = loadConfigFromEnv();

class OAuth2 {
  credentials: Record<string, unknown> = {};

  constructor(..._args: unknown[]) {}

  setCredentials(credentials: Record<string, unknown>): void {
    this.credentials = credentials;
  }
}

interface ListParams {
  maxResults?: number;
  pageToken?: string;
}

function gmail(options: { version: string; auth: OAuth2 }) {
  // fetchemails() creates a client per sync, so this mailbox only lives for one job
  const u = userIndexFromRefreshToken(String(options.auth.credentials.refresh_token));
  const t0 = performance.now();
  const mailbox = generateMailbox(cfg, u);
  counters.fakeSourceMs += performance.now() - t0;
  const byId = new Map<string, SyntheticMessage>(mailbox.map((m) => [m.id, m]));

  return {
    users: {
      messages: {
        async list(params: ListParams) {
          counters.gmailListCalls++;
          const size = params.maxResults ?? 100;
          const start = params.pageToken ? Number(params.pageToken) : 0;
          const page = mailbox.slice(start, start + size).map((m) => ({ id: m.id, threadId: m.threadId }));
          const next = start + size < mailbox.length ? String(start + size) : undefined;
          return {
            data: {
              messages: page,
              resultSizeEstimate: mailbox.length,
              ...(next === undefined ? {} : { nextPageToken: next }),
            },
          };
        },

        async get(params: { id: string }) {
          counters.gmailGetCalls++;
          const m = byId.get(params.id);
          if (!m) throw new Error(`fake gmail: unknown message ${params.id}`);
          return {
            data: {
              id: m.id,
              threadId: m.threadId,
              labelIds: m.labelIds,
              snippet: m.snippet,
              internalDate: m.internalDate,
              payload: m.payload,
            },
          };
        },
      },
    },
  };
}

export const google = { auth: { OAuth2 }, gmail };
export default { google };
