const fs = require('fs');
let content = fs.readFileSync('src/pages/IntegratorUsers.tsx', 'utf8');

// Under filteredResidents:
content = content.replace(
  /let matchesTab = true;\s*if \(filterTab === 'trial'\) \{/,
  `let matchesTab = true;
      if (filterTab === 'all') {
          matchesTab = r.role === UserRole.RESIDENT;
      } else if (filterTab === 'team') {
          matchesTab = r.role !== UserRole.RESIDENT;
      } else if (filterTab === 'trial') {`
);

// Under rendering tabs:
content = content.replace(
  /Todos \(\{residents\.length\}\)/,
  'Moradores ({totalResidents})'
);

content = content.replace(
  /<\/button>\s*<button\s*onClick=\{\(\) => setFilterTab\('trial'\)\}/,
  `</button>
            <button
                onClick={() => setFilterTab('team')}
                className={\`py-2.5 px-4 rounded-xl text-xs uppercase tracking-widest font-bold transition-all \${
                    filterTab === 'team'
                        ? 'bg-blue-500 text-black font-black'
                        : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                }\`}
            >
                Equipe ({residents.length - totalResidents})
            </button>
            <button
                onClick={() => setFilterTab('trial')}`
);

fs.writeFileSync('src/pages/IntegratorUsers.tsx', content);
