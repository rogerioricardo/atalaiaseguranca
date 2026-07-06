const fs = require('fs');
let content = fs.readFileSync('src/services/mockService.ts', 'utf8');

const replacementFallback = `const generateUUID = () => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};`;

if (!content.includes('const generateUUID')) {
    content = content.replace(
        `const sanitizeUUID = (id?: string): string | null => {`,
        replacementFallback + `\n\nconst sanitizeUUID = (id?: string): string | null => {`
    );
}

content = content.replace(
    /const id = typeof window !== 'undefined' && window\.crypto && window\.crypto\.randomUUID \? window\.crypto\.randomUUID\(\) : \(Math\.random\(\)\.toString\(36\)\.substring\(2\) \+ Date\.now\(\)\.toString\(36\)\);/g,
    `const id = generateUUID();`
);

// also let's check addCamera to only send maintenance_photo_url if it's populated to avoid failing if the column doesn't exist? Wait, Supabase strict mode will throw if the column does not exist even if undefined.
// We must either omit it from the object or they must run the SQL.

fs.writeFileSync('src/services/mockService.ts', content);
