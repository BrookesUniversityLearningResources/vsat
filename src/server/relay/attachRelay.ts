import type { Server } from "node:http";

import { WebSocket, WebSocketServer } from "ws";

import { sessionRegistry } from "./sessionRegistry.js";

/**
 * The path that remote-control clients (story "host" view and phone "remote"
 * view) connect to. Anything else is left for other upgrade handlers.
 */
const RELAY_PATH = "/ws/relay";

/**
 * How often to ping clients to detect dead connections. A host that vanishes
 * uncleanly (closed laptop, network drop, dyno kill) never sends a close frame,
 * so without this its session would linger in the lobby as a zombie.
 */
const HEARTBEAT_MS = Number(process.env.RELAY_HEARTBEAT_MS ?? 30000);

type Rooms = Map<string, Set<WebSocket>>;

/** Tracks which sockets answered the last heartbeat ping. */
const alive = new WeakMap<WebSocket, boolean>();

/**
 * A minimal in-memory relay for the remote-control feature.
 *
 * Clients connect with `?room=<code>` and every JSON message they send is
 * forwarded verbatim to the other members of the same room. The server is
 * deliberately dumb: it knows nothing about the message protocol — the story
 * page and the phone page agree on that between themselves.
 *
 * State lives only in this process's memory, so it assumes a single dyno. If we
 * ever scale horizontally this needs a shared pub/sub (e.g. Redis) instead.
 */
export default function attachRelay(server: Server): void {
  const wss = new WebSocketServer({ noServer: true });
  const rooms: Rooms = new Map();

  const heartbeat = setInterval(() => {
    const dead: WebSocket[] = [];
    for (const peers of rooms.values()) {
      for (const ws of peers) {
        if (alive.get(ws) === false) {
          dead.push(ws);
          continue;
        }
        alive.set(ws, false);
        try {
          ws.ping();
        } catch {
          dead.push(ws);
        }
      }
    }
    // Terminate after iterating so we don't mutate the sets mid-loop; each
    // terminate triggers a `close` that cleans up the room and registry.
    for (const ws of dead) {
      ws.terminate();
    }
  }, HEARTBEAT_MS);

  server.on("close", () => clearInterval(heartbeat));

  server.on("upgrade", (req, socket, head) => {
    let pathname: string;
    let room: string | null;
    let role: string;

    try {
      const url = new URL(req.url ?? "", "http://localhost");
      pathname = url.pathname;
      room = url.searchParams.get("room");
      role = url.searchParams.get("role") ?? "remote";
    } catch {
      socket.destroy();
      return;
    }

    if (pathname !== RELAY_PATH) {
      return;
    }

    if (!room) {
      socket.destroy();
      return;
    }

    const roomCode = room;
    const roomRole = role;
    wss.handleUpgrade(req, socket, head, (ws) => {
      joinRoom(rooms, roomCode, roomRole, ws);
    });
  });
}

function joinRoom(
  rooms: Rooms,
  room: string,
  role: string,
  ws: WebSocket,
): void {
  let peers = rooms.get(room);
  if (!peers) {
    peers = new Set();
    rooms.set(room, peers);
  }
  peers.add(ws);
  sessionRegistry.join(room, role, ws);

  alive.set(ws, true);
  ws.on("pong", () => alive.set(ws, true));

  ws.on("message", (data, isBinary) => {
    // Keep the lobby's snapshot of the room fresh, but stay a blind forwarder
    // otherwise — clients own the message protocol.
    if (!isBinary) {
      try {
        const message = JSON.parse(data.toString());
        if (message?.type === "state") {
          sessionRegistry.recordState(room, message);
        }
      } catch {
        // not JSON we care about; forward it anyway
      }
    }

    for (const peer of peers) {
      if (peer !== ws && peer.readyState === WebSocket.OPEN) {
        peer.send(data, { binary: isBinary });
      }
    }
  });

  const leave = () => {
    peers.delete(ws);
    if (peers.size === 0) {
      rooms.delete(room);
    }
    sessionRegistry.leave(room, ws);
  };

  ws.on("close", leave);
  ws.on("error", leave);
}
