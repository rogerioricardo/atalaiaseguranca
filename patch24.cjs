const fs = require('fs');
let content = fs.readFileSync('src/pages/MapPage.tsx', 'utf8');

const target = `<TileLayer
                    attribution={SATELLITE_ATTRIBUTION}
                    url={SATELLITE_URL}
                />`;

const replacement = `<TileLayer
                    attribution={SATELLITE_ATTRIBUTION}
                    url={SATELLITE_URL}
                />
                <TileLayer
                    url='https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
                />
                <TileLayer
                    url='https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'
                />`;

content = content.replace(target, replacement);
fs.writeFileSync('src/pages/MapPage.tsx', content);
