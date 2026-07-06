const fs = require('fs');
let content = fs.readFileSync('src/services/mockService.ts', 'utf8');

content = content.replace(
    /console\.error\("\[MockService\] Error fetching neighborhoods:", error\);/g,
    'console.error("[MockService] Error fetching neighborhoods:", JSON.stringify(error));'
);
content = content.replace(
    /console\.error\("\[MockService\] Catch in getNeighborhoods:", e\);/g,
    'console.error("[MockService] Catch in getNeighborhoods:", e instanceof Error ? e.message : JSON.stringify(e));'
);

fs.writeFileSync('src/services/mockService.ts', content);
