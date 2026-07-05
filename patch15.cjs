const fs = require('fs');

let content = fs.readFileSync('src/pages/Cameras.tsx', 'utf8');

// Modifica o srcDoc return do CameraStreamPlayer (done)
// Modifica o iframe regular do CameraStreamPlayer
content = content.replace(
  'className="w-full h-full border-0 absolute inset-0" \n         allowFullScreen',
  'className="w-full h-full border-0 absolute inset-0 pointer-events-none" \n         allowFullScreen'
);

content = content.replace(
  /className="w-full h-full border-0 absolute inset-0"\s+allowFullScreen/g,
  'className="w-full h-full border-0 absolute inset-0 pointer-events-none"\n         allowFullScreen'
);

// We need to remove the whole Button element containing "EXPANDIR E MONITORAR"
content = content.replace(/<Button[^>]*>\s*<Maximize2[^>]*\/>\s*EXPANDIR E MONITORAR\s*<\/Button>/g, '');

fs.writeFileSync('src/pages/Cameras.tsx', content);
