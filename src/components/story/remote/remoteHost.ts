/**
 * The viewer-agnostic "host" side of remote control.
 *
 * It owns the relay socket, the room code, the badge, reconnect, and the
 * message protocol; it knows nothing about HOW a particular viewer renders or
 * navigates. A viewer supplies three hooks — read its current state, apply a
 * navigation, restart — so both the 360° A-Frame viewer and the flat 2D viewer
 * can host identically and appear in the same lobby.
 *
 * Auto-arm: every viewer registers a session. An explicit `?room=CODE` joins a
 * named room; otherwise a code is generated and pinned into the URL (so reloads
 * keep the same session and the link is shareable).
 */
export type LinkOption = { text: string; link: string };

export type StateMessage = {
  type: "state";
  storyTitle: string;
  sceneId: number | undefined;
  sceneTitle: string;
  heading: string;
  body: string;
  image: string | null;
  pageNumber: number;
  links: LinkOption[];
};

export type RemoteHostHooks = {
  /** Build the current state payload for the remote, or null if not ready. */
  getState: () => StateMessage | null;
  /** Apply a navigation the remote requested (a link target). */
  navigate: (link: string) => void;
  /** Reset the experience to the story's start. */
  restart: () => void;
};

export type RemoteHost = {
  /** Call after the viewer's state changes so the host re-broadcasts. */
  notifyChange: () => void;
};

/** Codes a person may read aloud — no easily-confused characters. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateCode(length = 4): string {
  const buffer = new Uint32Array(length);
  window.crypto?.getRandomValues?.(buffer);
  let code = "";
  for (let i = 0; i < length; i += 1) {
    const value = buffer[i] || Math.floor(Math.random() * CODE_ALPHABET.length);
    code += CODE_ALPHABET[value % CODE_ALPHABET.length];
  }
  return code;
}

function showBadge(code: string): void {
  const badge = document.createElement("div");
  badge.textContent = `Remote: ${code}`;
  badge.style.cssText = [
    "position:fixed",
    "top:0.6rem",
    "right:0.6rem",
    "z-index:10002",
    "padding:0.35rem 0.6rem",
    "border-radius:999px",
    "background:rgba(20,23,28,0.85)",
    "color:#ecf0f1",
    "font:600 0.8rem/1 'Source Sans Pro',system-ui,sans-serif",
    "letter-spacing:0.08em",
    "pointer-events:none",
  ].join(";");
  document.body.appendChild(badge);
}

export function startRemoteHost(hooks: RemoteHostHooks): RemoteHost {
  const params = new URLSearchParams(window.location.search);
  let room = params.get("room")?.trim() ?? "";
  if (!room) {
    room = generateCode();
    params.set("room", room);
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${query}${window.location.hash}`,
    );
  }

  showBadge(room);

  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const url = `${protocol}://${window.location.host}/ws/relay?room=${encodeURIComponent(room)}&role=host`;
  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

  const sendState = () => {
    if (socket?.readyState !== WebSocket.OPEN) {
      return;
    }
    const state = hooks.getState();
    if (state) {
      socket.send(JSON.stringify(state));
    }
  };

  const handleMessage = (event: MessageEvent) => {
    let message: { type?: string; link?: unknown };
    try {
      message = JSON.parse(event.data as string);
    } catch {
      return;
    }

    if (message.type === "hello") {
      sendState();
      return;
    }
    if (message.type === "navigate" && typeof message.link === "string") {
      hooks.navigate(message.link);
      return;
    }
    if (message.type === "restart") {
      hooks.restart();
    }
  };

  // Reconnect if the socket drops (dyno cycling, network blip).
  const connect = () => {
    socket = new WebSocket(url);
    socket.addEventListener("open", sendState);
    socket.addEventListener("message", handleMessage);
    socket.addEventListener("close", () => {
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connect, 1000);
    });
    socket.addEventListener("error", () => socket?.close());
  };

  connect();

  return { notifyChange: sendState };
}
