const WebSocket = require("ws");

const WS_URL = "ws://localhost:3000/webops-stream";

let events = [];
let intervals = [];
let last = null;

console.log("Starting REALITY VERIFICATION TEST...");

const ws = new WebSocket(WS_URL);

let connected = false;

ws.on("open", () => {
  connected = true;
  console.log("WebSocket connected. Listening for 15 seconds...");
});

ws.on("message", (data) => {
  const msg = JSON.parse(data.toString());
  const now = Date.now();

  events.push(msg);

  if (last !== null) {
    intervals.push(now - last);
  }

  last = now;

  console.log("EVENT:", msg.type || msg.event || msg);
});

function runRealityCheck() {
  console.log("\n===== REALITY REPORT =====");

  if (!connected) {
    return {
      verdict: "NO_WEBSOCKET_CONNECTION → LIKELY SIMULATION OR OFFLINE FALLBACK",
    };
  }

  if (events.length < 5) {
    return {
      verdict: "INSUFFICIENT DATA (Received " + events.length + " events). The backend is connected but not streaming enough raw events.",
    };
  }

  let score = 0;

  const hasBackendSignal = events.some(
    (e) => e.source === "server" || e.origin === "backend" || e.timestamp
  );
  if (hasBackendSignal) score += 35;

  const avg = intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 0;
  const variance = intervals.length > 0 ? intervals.reduce((acc, v) => acc + Math.abs(v - avg), 0) / intervals.length : 0;

  if (variance > 70) {
    score += 30; // real systems
  } else {
    score -= 25; // simulation loop
  }

  const isLoop = intervals.length > 0 && intervals.every((t, i, arr) => i === 0 || Math.abs(t - arr[i - 1]) < 5);

  if (isLoop) {
    score -= 40;
  } else {
    score += 20;
  }

  const types = new Set(events.map(e => e.type || e.event)).size;

  if (types >= 4) score += 20;
  else score -= 10;

  let verdict =
    score >= 70
      ? "REAL_TIME_BACKEND_STREAM (PASS)"
      : score >= 40
      ? "HYBRID SYSTEM (REAL + SIMULATION MIX)"
      : "SIMULATED TELEMETRY (FAIL)";

  return {
    score,
    verdict,
    details: {
      messages: events.length,
      avgInterval: avg,
      variance,
      uniqueEventTypes: types,
    },
  };
}

setTimeout(() => {
  const result = runRealityCheck();
  console.log(result);
  process.exit(0);
}, 15000);
