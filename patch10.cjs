const fs = require('fs');
let content = fs.readFileSync('src/services/mockService.ts', 'utf8');

const target = `    const local = getLocalCameras();
    const index = local.findIndex(c => c.id === cameraId);
    if (index !== -1) {
        local[index] = {
            ...local[index],
            name,
            iframeCode,
            lat,
            lng,
            locationPhotoUrl,
            maintenancePhotoUrl
        };
        saveLocalCameras(local);
    }`;

const insert = `    const local = getLocalCameras();
    const index = local.findIndex(c => c.id === cameraId);
    if (index !== -1) {
        local[index] = {
            ...local[index],
            name,
            iframeCode,
            lat,
            lng,
            locationPhotoUrl,
            maintenancePhotoUrl
        };
    } else {
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
    }
    saveLocalCameras(local);`;

content = content.replace(target, insert);
fs.writeFileSync('src/services/mockService.ts', content);
