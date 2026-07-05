const fs = require('fs');
let content = fs.readFileSync('src/services/mockService.ts', 'utf8');

content = content.replace(
  'updateCamera: async (cameraId: string, name: string, iframeCode: string, lat?: number, lng?: number, locationPhotoUrl?: string, maintenancePhotoUrl?: string): Promise<void> => {',
  'updateCamera: async (cameraId: string, name: string, iframeCode: string, lat?: number, lng?: number, locationPhotoUrl?: string, maintenancePhotoUrl?: string, neighborhoodId?: string): Promise<void> => {'
);

const target = `    } else {
        // If it was only in DB, we need to save it locally now so the update persists if DB fails
        local.push({
            id: cameraId,
            neighborhoodId: 'unknown', // Will be fetched from DB next time
            name,
            iframeCode,
            lat,
            lng,
            locationPhotoUrl,
            maintenancePhotoUrl
        });
    }`;

const insert = `    } else if (neighborhoodId) {
        local.push({
            id: cameraId,
            neighborhoodId: neighborhoodId,
            name,
            iframeCode,
            lat,
            lng,
            locationPhotoUrl,
            maintenancePhotoUrl
        });
    }`;

content = content.replace(target, insert);
fs.writeFileSync('src/services/mockService.ts', content);
