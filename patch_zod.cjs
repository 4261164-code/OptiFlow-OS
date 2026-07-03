const fs = require('fs');
let code = fs.readFileSync('server/workers/agents/dailyBrain.ts', 'utf8');

code = code.replace(
  `import OpenAI from "openai";`,
  `import OpenAI from "openai";
import { z } from "zod";

const decisionSchema = z.object({
  actions: z.array(z.object({
    type: z.string(),
    payload: z.any()
  }))
});`
);

code = code.replace(
  `         try {
             decisions = JSON.parse(response.choices[0].message.content || '{"actions":[]}');
         } catch(e) {
             logger.error("[Daily Brain] Failed to parse JSON from AI.");
         }`,
  `         try {
             const parsed = JSON.parse(response.choices[0].message.content || '{"actions":[]}');
             decisions = decisionSchema.parse(parsed);
         } catch(e: any) {
             logger.error(\`[Daily Brain] Failed to parse or validate JSON from AI: \${e.message}\`);
             return;
         }`
);

fs.writeFileSync('server/workers/agents/dailyBrain.ts', code);
