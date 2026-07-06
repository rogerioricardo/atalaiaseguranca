const fs = require('fs');
let content = fs.readFileSync('src/services/mockService.ts', 'utf8');

content = content.replace(
    /const payload: any = \{\s*id,\s*neighborhood_id: sanitizeUUID\(neighborhoodId\),[\s\S]*?const \{ error \} = await supabase\.from\('cameras'\)\.insert\(\[payload\]\);/,
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
        if (maintenancePhotoUrl) {
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

content = content.replace(
    /const payload: any = \{ \s*name, \s*iframe_code: iframeCode,[\s\S]*?const \{ error \} = await supabase\.from\('cameras'\)\.update\(payload\)\s*\.eq\('id', cameraId\);/,
    `const payload: any = { 
                name, 
                iframe_code: iframeCode,
                lat,
                lng,
                location_photo_url: locationPhotoUrl
            };
            let error;
            if (maintenancePhotoUrl) {
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

fs.writeFileSync('src/services/mockService.ts', content);
