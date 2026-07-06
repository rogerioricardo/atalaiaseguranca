const fs = require('fs');
let content = fs.readFileSync('src/services/mockService.ts', 'utf8');

content = content.replace(
  /const getLocalCameras = \(\): Camera\[\] => \{[\s\S]*?return DEMO_CAMERAS; \/\/ fallback\n\};/g,
  `const getLocalCameras = (): Camera[] => {
  if (typeof window === 'undefined') return [];
  try {
    const cached = localStorage.getItem('atalaia_local_cameras');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return [];
      }
    }
  } catch (err) {
    console.warn("[MockService] localStorage is disabled or inaccessible", err);
  }
  return []; // Fallback to empty instead of DEMO_CAMERAS if we want DB data only, or return DEMO if we want. Wait, the original code had return [] at the end of the block I saw earlier! Let me just use a safe replacement based on exact match.
};`
);

fs.writeFileSync('src/services/mockService.ts', content);
