const fs = require('fs');
let code = fs.readFileSync('packages/queue/src/JobQueue.ts', 'utf8');

code = code.replace(
  `export class JobQueue<T = any> {`,
  `/**
 * @deprecated WARNING: This is an IN-MEMORY queue. It is NOT durable and will lose jobs on server restart or container scale-down.
 * DO NOT use this for anything user-facing or revenue-related. Use the Firestore-backed OrchestrationEngine for durable work.
 */
export class JobQueue<T = any> {`
);

fs.writeFileSync('packages/queue/src/JobQueue.ts', code);
