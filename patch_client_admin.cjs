const fs = require('fs');

function removeHardcoded(file) {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');
  
  // Replace the hardcoded checks with role checks
  code = code.replace(/auth\.currentUser\.email === '4261164@myuwc\.ac\.za'/g, "false");
  code = code.replace(/user\.email === '4261164@myuwc\.ac\.za'/g, "user.email === 'admin@example.com'");
  code = code.replace(/usr\.email === '4261164@myuwc\.ac\.za'/g, "usr.role === 'admin'");
  code = code.replace(/a\.email === '4261164@myuwc\.ac\.za'/g, "a.role === 'admin'");
  code = code.replace(/b\.email === '4261164@myuwc\.ac\.za'/g, "b.role === 'admin'");
  code = code.replace(/email: '4261164@myuwc\.ac\.za'/g, "email: 'sandbox@example.com'");
  code = code.replace(/4261164@myuwc\.ac\.za/g, "admin@example.com");

  fs.writeFileSync(file, code);
}

removeHardcoded('src/App.tsx');
removeHardcoded('src/components/SettingsPage.tsx');
removeHardcoded('src/components/OnboardingWizard.tsx');

