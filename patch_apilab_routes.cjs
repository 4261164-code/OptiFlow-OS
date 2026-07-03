const fs = require('fs');
let code = fs.readFileSync('src/pages/APILab.tsx', 'utf8');

code = code.replace(
  /const predefinedRoutes = \[[\s\S]*?\];/g,
  `const predefinedRoutes = [
    '/api/health',
    '/api/strategy/audit',
    '/api/strategy/adopt',
    '/api/writing/generate',
    '/api/writing/edit',
    '/api/intel/scrape',
    '/api/intel/competitors',
    '/api/distro/schedule',
    '/api/distro/publish',
    '/api/pipeline/start',
    '/api/gsc/auth',
    '/api/analyst/query',
    '/api/orchestrator/command',
    '/api/events/track',
    '/api/tracking/pixel',
    '/api/analytics/metrics',
    '/api/rapidapi/search'
  ];`
);

fs.writeFileSync('src/pages/APILab.tsx', code);
