const fs = require('fs');
let content = fs.readFileSync('src/pages/Cameras.tsx', 'utf8');

content = content.replace(
  'const CameraStreamPlayer: React.FC<CameraStreamPlayer maintenancePhotoUrl={cam.maintenancePhotoUrl}Props> = React.memo(({',
  'const CameraStreamPlayer: React.FC<CameraStreamPlayerProps> = React.memo(({'
);

content = content.replace(
  '<CameraStreamPlayer maintenancePhotoUrl={cam.maintenancePhotoUrl}\n                     iframeCode={selectedCameraForModal.iframeCode}',
  '<CameraStreamPlayer maintenancePhotoUrl={selectedCameraForModal.maintenancePhotoUrl}\n                     iframeCode={selectedCameraForModal.iframeCode}'
);

fs.writeFileSync('src/pages/Cameras.tsx', content);
