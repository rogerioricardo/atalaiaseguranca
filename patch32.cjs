const fs = require('fs');
let content = fs.readFileSync('src/pages/IntegratorUsers.tsx', 'utf8');

content = content.replace(
  /useState<'all' \| 'trial' \| 'subscribed' \| 'free'>\('all'\);/,
  "useState<'all' | 'team' | 'trial' | 'subscribed' | 'free'>('all');"
);

fs.writeFileSync('src/pages/IntegratorUsers.tsx', content);
