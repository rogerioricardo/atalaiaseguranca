const fs = require('fs');
let content = fs.readFileSync('src/services/mockService.ts', 'utf8');

content = content.replace(
  'locationPhotoUrl: c.location_photo_url,\n                maintenancePhotoUrl: c.maintenance_photo_url,\n                    maintenancePhotoUrl: c.maintenance_photo_url',
  'locationPhotoUrl: c.location_photo_url,\n                    maintenancePhotoUrl: c.maintenance_photo_url'
);

fs.writeFileSync('src/services/mockService.ts', content);
