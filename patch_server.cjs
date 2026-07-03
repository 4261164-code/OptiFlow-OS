const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  `import express from "express";`,
  `import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";`
);

code = code.replace(
  `  const app = express();`,
  `  const app = express();

  // Baseline Hardening (Task 10)
  app.use(helmet({
    contentSecurityPolicy: false, // Vite Dev handles its own CSP, disable for local/sandbox if needed
  }));
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.APP_URL || '', /https:\\/\\/.*\\.run\\.app$/] 
      : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }));
  
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000, // global high limit, specific routes have tighter limits
    message: "Too many requests from this IP, please try again later"
  });
  app.use(globalLimiter);`
);

fs.writeFileSync('server.ts', code);
