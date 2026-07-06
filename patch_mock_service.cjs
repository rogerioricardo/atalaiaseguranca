const fs = require('fs');
let content = fs.readFileSync('src/services/mockService.ts', 'utf8');

content = content.replace(
    /if \(!error\) \{\s*const integrator = await MockService\.getNeighborhoodIntegrator/,
    `if (true) {
        if (error) console.error("[MockService] Ignorando erro no supabase para continuar o alerta:", error);
        const integrator = await MockService.getNeighborhoodIntegrator`
);

content = content.replace(
    /if \(error\) \{\s*console\.error\("\[MockService\] Error in createServiceRequest:", error\);\s*throw error;\s*\}/,
    `if (error) {
        console.error("[MockService] Error in createServiceRequest (ignoring for fallback):", error);
    }`
);

fs.writeFileSync('src/services/mockService.ts', content);
