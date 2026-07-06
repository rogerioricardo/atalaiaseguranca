const fs = require('fs');
let content = fs.readFileSync('src/services/mockService.ts', 'utf8');

// For addCamera
content = content.replace(
    /const payload: any = \{\s*id,\s*neighborhood_id: sanitizeUUID\(neighborhoodId\), \s*name, \s*iframe_code: iframeCode,\s*lat,\s*lng,\s*location_photo_url: locationPhotoUrl\s*\};\s*if \(maintenancePhotoUrl !== undefined\) \{\s*payload\.maintenance_photo_url = maintenancePhotoUrl;\s*\}\s*const \{ error \} = await supabase\.from\('cameras'\)\.insert\(\[payload\]\);/,
    `const payload: any = {
            id,
            neighborhood_id: sanitizeUUID(neighborhoodId), 
            name, 
            iframe_code: iframeCode,
            lat,
            lng,
            location_photo_url: locationPhotoUrl
        };
        let error;
        if (maintenancePhotoUrl !== undefined && maintenancePhotoUrl !== "") {
            payload.maintenance_photo_url = maintenancePhotoUrl;
            const res = await supabase.from('cameras').insert([payload]);
            error = res.error;
            if (error && error.message && error.message.includes("maintenance_photo_url")) {
                console.warn("[MockService] Coluna maintenance_photo_url ausente, tentando sem ela...");
                delete payload.maintenance_photo_url;
                const res2 = await supabase.from('cameras').insert([payload]);
                error = res2.error;
            }
        } else {
            const res = await supabase.from('cameras').insert([payload]);
            error = res.error;
        }`
);

// For updateCamera
content = content.replace(
    /const payload: any = \{ \s*name, \s*iframe_code: iframeCode,\s*lat,\s*lng,\s*location_photo_url: locationPhotoUrl\s*\};\s*if \(maintenancePhotoUrl !== undefined\) \{\s*payload\.maintenance_photo_url = maintenancePhotoUrl;\s*\}\s*const \{ error \} = await supabase\.from\('cameras'\)\.update\(payload\)/,
    `const payload: any = { 
                name, 
                iframe_code: iframeCode,
                lat,
                lng,
                location_photo_url: locationPhotoUrl
            };
            let error;
            if (maintenancePhotoUrl !== undefined && maintenancePhotoUrl !== "") {
                payload.maintenance_photo_url = maintenancePhotoUrl;
                const res = await supabase.from('cameras').update(payload).eq('id', cameraId);
                error = res.error;
                if (error && error.message && error.message.includes("maintenance_photo_url")) {
                    console.warn("[MockService] Coluna maintenance_photo_url ausente no update, tentando sem ela...");
                    delete payload.maintenance_photo_url;
                    const res2 = await supabase.from('cameras').update(payload).eq('id', cameraId);
                    error = res2.error;
                }
            } else {
                const res = await supabase.from('cameras').update(payload).eq('id', cameraId);
                error = res.error;
            }`
);

// We need to also fix `.eq('id', cameraId);` being duplicated or missed in updateCamera.
// In the original code we replaced, the original string was `await supabase.from('cameras').update(payload)`. The `.eq('id', cameraId);` is immediately after.
// But we replaced it and added it in our own string. Let's make sure we don't have `.eq('id', cameraId);.eq('id', cameraId);`
