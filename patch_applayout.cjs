const fs = require('fs');
let code = fs.readFileSync('src/components/AppLayout.tsx', 'utf8');

code = code.replace(
  /\{ label: "Settings", href: "\/settings", icon: SettingsIcon \},/g,
  `{ label: "Settings", href: "/settings", icon: SettingsIcon },
        { label: "API Sandbox", href: "/apilab", icon: Activity },`
);

fs.writeFileSync('src/components/AppLayout.tsx', code);
