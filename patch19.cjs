const fs = require('fs');

['src/pages/Dashboard.tsx', 'src/pages/MapPage.tsx'].forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(
        /className="w-full h-full border-0"\s+allowFullScreen/g,
        'className="w-full h-full border-0 pointer-events-none"\n                          allowFullScreen'
    );
    fs.writeFileSync(file, content);
});

