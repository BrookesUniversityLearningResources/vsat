import type { WebSocket } from "ws";

/**
 * What the lobby ("active sessions" page) shows for each live session.
 */
export type SessionSummary = {
  code: string;
  storyTitle: string;
  heading: string;
  sceneTitle: string;
  clients: number;
};

type StateSnapshot = {
  storyTitle?: string;
  heading?: string;
  sceneTitle?: string;
};

type Session = {
  peers: Set<WebSocket>;
  hosts: Set<WebSocket>;
  lastState: StateSnapshot | null;
  createdAt: number;
  /** Last time the session did something (connected or navigated). */
  lastActivityAt: number;
};

/**
 * The lobby lists only sessions active within this window, so idle/abandoned
 * tabs (still connected, but nobody's clicking) drop off and reappear on the
 * next navigation. Configurable for tests.
 */
const ACTIVE_WINDOW_MS = Number(
  process.env.RELAY_ACTIVE_WINDOW_MS ?? 15 * 60 * 1000,
);

/**
 * Tracks which remote-control sessions are currently live so the lobby can list
 * them. This is the one piece of state the relay keeps beyond blind forwarding:
 * it remembers who is connected to each room and the last state a host
 * broadcast, so a co-pilot can browse and join sessions.
 *
 * Process-local (single dyno), like the relay itself.
 */
function createSessionRegistry() {
  const sessions = new Map<string, Session>();

  const ensure = (code: string): Session => {
    let session = sessions.get(code);
    if (!session) {
      session = {
        peers: new Set(),
        hosts: new Set(),
        lastState: null,
        createdAt: Date.now(),
        lastActivityAt: Date.now(),
      };
      sessions.set(code, session);
    }
    return session;
  };

  return {
    join(code: string, role: string, ws: WebSocket): void {
      const session = ensure(code);
      session.peers.add(ws);
      session.lastActivityAt = Date.now();
      if (role === "host") {
        session.hosts.add(ws);
      }
    },

    recordState(code: string, state: StateSnapshot): void {
      const session = sessions.get(code);
      if (!session) {
        return;
      }
      session.lastState = {
        storyTitle: state.storyTitle,
        heading: state.heading,
        sceneTitle: state.sceneTitle,
      };
      session.lastActivityAt = Date.now();
    },

    leave(code: string, ws: WebSocket): void {
      const session = sessions.get(code);
      if (!session) {
        return;
      }
      session.peers.delete(ws);
      session.hosts.delete(ws);
      if (session.peers.size === 0) {
        sessions.delete(code);
      }
    },

    /** Live (a host present) and active within the window are listed. */
    list(): SessionSummary[] {
      const now = Date.now();
      return [...sessions.entries()]
        .filter(
          ([, session]) =>
            session.hosts.size > 0 &&
            now - session.lastActivityAt < ACTIVE_WINDOW_MS,
        )
        .sort((a, b) => a[1].createdAt - b[1].createdAt)
        .map(([code, session]) => ({
          code,
          storyTitle: session.lastState?.storyTitle ?? "",
          heading: session.lastState?.heading ?? "",
          sceneTitle: session.lastState?.sceneTitle ?? "",
          clients: session.peers.size,
        }));
    },
  };
}

export const sessionRegistry = createSessionRegistry();
export type SessionRegistry = ReturnType<typeof createSessionRegistry>;
