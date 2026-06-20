const WebSocket = require("ws");
const crypto = require("crypto");

const WS_URL = "ws://localhost:3000/webops-stream";
const WEBOPS_SECRET = process.env.WEBOPS_SECRET || "super_secret_audit_key";
const EXPECTED_KEY_VERSION = "v1";

let events = [];
let intervals = [];
let last = null;
let auditResponse = null;

console.log("Starting WEBOPS TRUTH ENGINE TEST...");
console.log("Layer 1: Simulation Entropy");
console.log("Layer 2: HMAC Origin Verification");
console.log("Layer 3: Cryptographic Challenge/Response");
console.log("Layer 4: Tamper-Evident Event Chains");
console.log("Layer 5: Provenance Validation\n");

const ws = new WebSocket(WS_URL);

let connected = false;

ws.on("open", () => {
  connected = true;
  console.log("WebSocket connected.");
  
  // Issue Audit Challenge
  const nonce = crypto.randomBytes(16).toString("hex");
  console.log(`Sending AUDIT_CHALLENGE (nonce: ${nonce})...`);
  ws.send(JSON.stringify({ type: "AUDIT_CHALLENGE", nonce }));
  
  // Save nonce for verification later
  global.auditNonce = nonce;
});

ws.on("message", (data) => {
  const msg = JSON.parse(data.toString());
  const now = Date.now();

  if (msg.type === "AUDIT_RESPONSE") {
    console.log("Received AUDIT_RESPONSE!");
    auditResponse = msg;
    return;
  }

  // Handle telemetry events
  events.push(msg);

  if (last !== null) {
    intervals.push(now - last);
  }
  last = now;
});

function verifyEventSignature(event) {
  if (!event.signature) return false;
  const payloadStr = JSON.stringify({ 
    type: event.type, 
    message: event.message, 
    severity: event.severity, 
    service: event.service, 
    source: event.source,
    metric: event.metric,
    value: event.value,
    previousEventHash: event.previousEventHash
  });
  const hmac = crypto.createHmac("sha256", WEBOPS_SECRET);
  hmac.update((event.eventId || "") + (event.timestamp || "") + payloadStr + (event.keyVersion || ""));
  return hmac.digest("hex") === event.signature;
}

function verifyAuditResponse(response, expectedNonce) {
  if (!response || !response.signature) return false;
  if (response.nonce !== expectedNonce) return false;
  
  const hmac = crypto.createHmac("sha256", WEBOPS_SECRET);
  hmac.update("AUDIT_RESPONSE" + expectedNonce + response.serverTime + (response.keyVersion || ""));
  return hmac.digest("hex") === response.signature;
}

function verifyEventChain(events) {
  for (let i = 1; i < events.length; i++) {
    const prevEvent = events[i - 1];
    const currEvent = events[i];
    
    const prevHash = crypto.createHash("sha256").update(JSON.stringify(prevEvent)).digest("hex");
    if (currEvent.previousEventHash !== prevHash) {
      return false;
    }
  }
  return true;
}

function runTruthEngine() {
  console.log("\n===== TRUTH ENGINE REPORT =====");

  if (!connected) {
    return { status: "COMPROMISED", reason: "NO_WEBSOCKET_CONNECTION" };
  }
  
  // 1. Audit Check
  const challengePassed = verifyAuditResponse(auditResponse, global.auditNonce);
  if (!challengePassed) {
    return { status: "COMPROMISED", reason: "CHALLENGE_RESPONSE_FAILED" };
  }
  if (auditResponse.keyVersion !== EXPECTED_KEY_VERSION) {
    return { status: "COMPROMISED", reason: "INVALID_KEY_VERSION" };
  }
  
  // 2. Fallback check
  const isSimulationMode = events.some(e => e.type === "SIMULATION_MODE_ENTERED");
  if (isSimulationMode) {
    return { status: "COMPROMISED", reason: "CLIENT_SIMULATION_DETECTED" };
  }

  if (events.length < 5) {
    return { status: "UNVERIFIED", reason: "INSUFFICIENT_DATA" };
  }

  // 3. HMAC signatures
  const allEventsSigned = events.every(verifyEventSignature);
  if (!allEventsSigned) {
    return { status: "COMPROMISED", reason: "INVALID_ORIGIN_SIGNATURES" };
  }
  
  // 4. Crypto Event Chain
  const chainIntact = verifyEventChain(events);
  if (!chainIntact) {
    return { status: "COMPROMISED", reason: "BROKEN_EVENT_CHAIN (TAMPERED)" };
  }

  // 5. System Provenance Check
  const hasRealMetrics = events.some(e => e.source === "process.memoryUsage()" || e.source === "os.loadavg()" || e.source === "os.uptime()");
  const isProvenanceValid = events.every(e => !e.metric || (e.value !== undefined && e.source));
  
  if (!hasRealMetrics || !isProvenanceValid) {
    return { status: "DEGRADED", reason: "MISSING_REAL_PROVENANCE" };
  }
  
  // 6. Entropy
  const avg = intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 0;
  const variance = intervals.length > 0 ? intervals.reduce((acc, v) => acc + Math.abs(v - avg), 0) / intervals.length : 0;
  const isLoop = intervals.length > 0 && intervals.every((t, i, arr) => i === 0 || Math.abs(t - arr[i - 1]) < 5);

  if (isLoop || variance < 30) {
    return { status: "DEGRADED", reason: "LOW_ENTROPY_DETECTED", variance };
  }

  return {
    status: "FORENSICALLY_AUTHENTIC (Pass)",
    details: {
      messagesVerified: events.length,
      auditChallenge: "PASSED",
      signatures: "PASSED",
      eventChain: "INTACT (NO TAMPERING)",
      provenance: "VERIFIED_SYSTEM_METRICS",
      keyVersion: auditResponse.keyVersion,
      entropyVariance: variance.toFixed(2),
    }
  };
}

setTimeout(() => {
  const result = runTruthEngine();
  console.log(result);
  process.exit(result.status === "AUTHENTIC" ? 0 : 1);
}, 10000); // Wait 10 seconds to collect enough data
