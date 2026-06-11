# API Endpoints v2.0

## Execution Engine

### `POST /api/run-pipeline`
Orchestrates the synchronous and asynchronous execution of the multi-agent pipeline.

**Payload:**
\`\`\`json
{
  "userId": "auth_token_id",
  "jobId": "unique_job_id",
  "keyword": "pinterest traffic",
  "articleLength": 2000,
  "seoLevel": "High",
  "hasFaq": true,
  "numPins": 5
}
\`\`\`

**Returns:**
\`\`\`json
{
  "articleId": "id",
  "article": { "title": "...", "content": "..." },
  "pins": []
}
\`\`\`

## Telemetry APIs

### `GET /api/executive-summary`
Generates real-time conversational analysis computed from the active Firestore data set via Gemini.

**Payload:**
\`\`\`json
{
  "jobs": [...],
  "articles": [...],
  "pins": [...]
}
\`\`\`

**Returns:**
\`\`\`json
{
  "summary": "...",
  "urgentTasks": ["..."],
  "healthScore": 92,
  "milestones": ["..."]
}
\`\`\`

## Revenue Webhooks (Planned)

### `POST /api/webhooks/postback`
Captures conversion pixels and sub-id parameters to match CPA network events back to the origin Campaign content, enriching the \`revenue_metrics\` database.
