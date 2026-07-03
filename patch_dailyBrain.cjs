const fs = require('fs');
let code = fs.readFileSync('server/workers/agents/dailyBrain.ts', 'utf8');

code = code.replace(
  /  \} catch \(error: any\) \{\n      logger\.error\(\`\[Daily Brain\] Engine failure: \$\{error\.message\}\`\);\n  \}/g,
  `  } catch (error: any) {
      if (error.message && error.message.includes("429")) {
          logger.warn(\`[Daily Brain] Rate limit exceeded. Skipping this cycle. (\${error.message})\`);
      } else {
          logger.error(\`[Daily Brain] Engine failure: \${error.message}\`);
      }
  }`
);

fs.writeFileSync('server/workers/agents/dailyBrain.ts', code);
