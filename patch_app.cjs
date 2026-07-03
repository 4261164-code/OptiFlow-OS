const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /import \{ SettingsPage \} from '\.\/components\/SettingsPage';/g,
  `import { SettingsPage } from './components/SettingsPage';\nimport APILab from './pages/APILab';`
);

code = code.replace(
  /<Route path="\/settings" element=\{<SettingsPage \/>\} \/>/g,
  `<Route path="/settings" element={<SettingsPage />} />\n            <Route path="/apilab" element={<APILab />} />`
);

fs.writeFileSync('src/App.tsx', code);
