const fs = require('fs');
let content = fs.readFileSync('src/services/mockService.ts', 'utf8');

content = content.replace(
    /if \(error\) \{\s*console\.error\("\[MockService\] Error in registerPatrol:", error\);\s*throw error;\s*\}/,
    `if (error) {
        console.error("[MockService] Error in registerPatrol (ignoring for fallback):", error);
        // Do not throw, continue to send notifications
    }`
);

fs.writeFileSync('src/services/mockService.ts', content);
