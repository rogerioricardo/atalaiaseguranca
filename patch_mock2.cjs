const fs = require('fs');
let content = fs.readFileSync('src/services/mockService.ts', 'utf8');

// In addCamera
content = content.replace(
    /const { error } = await supabase\.from\('cameras'\)\.insert\(\[\{\s*id,\s*neighborhood_id: sanitizeUUID\(neighborhoodId\),\s*name,\s*iframe_code: iframeCode,\s*lat,\s*lng,\s*location_photo_url: locationPhotoUrl,\s*maintenance_photo_url: maintenancePhotoUrl\s*\}\]\);/,
    `const payload: any = {
            id,
            neighborhood_id: sanitizeUUID(neighborhoodId), 
            name, 
            iframe_code: iframeCode,
            lat,
            lng,
            location_photo_url: locationPhotoUrl
        };
        if (maintenancePhotoUrl !== undefined) {
            payload.maintenance_photo_url = maintenancePhotoUrl;
        }
        const { error } = await supabase.from('cameras').insert([payload]);`
);

// In updateCamera
content = content.replace(
    /const \{ error \} = await supabase\.from\('cameras'\)\s*\.update\(\{ \s*name, \s*iframe_code: iframeCode,\s*lat,\s*lng,\s*location_photo_url: locationPhotoUrl,\s*maintenance_photo_url: maintenancePhotoUrl\s*\}\)/,
    `const payload: any = { 
                name, 
                iframe_code: iframeCode,
                lat,
                lng,
                location_photo_url: locationPhotoUrl
            };
            if (maintenancePhotoUrl !== undefined) {
                payload.maintenance_photo_url = maintenancePhotoUrl;
            }
            const { error } = await supabase.from('cameras').update(payload)`
);

fs.writeFileSync('src/services/mockService.ts', content);
