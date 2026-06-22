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
};

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
      };
      sessions.set(code, session);
    }
    return session;
  };

  return {
    join(code: string, role: string, ws: WebSocket): void {
      const session = ensure(code);
      session.peers.add(ws);
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

    /** Only sessions that have a live experience (a host) are listed. */
    list(): SessionSummary[] {
      return [...sessions.entries()]
        .filter(([, session]) => session.hosts.size > 0)
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
