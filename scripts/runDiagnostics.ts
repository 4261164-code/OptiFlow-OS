
import { ApiHealthMonitor } from "../server/services/healthMonitor";

async function run() {
  console.log("Starting diagnostics...");
  const results = await ApiHealthMonitor.runDiagnostics();
  console.log(JSON.stringify(results, null, 2));
}

run().catch(console.error);
