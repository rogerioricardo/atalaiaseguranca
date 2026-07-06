const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const checkerCode = `
const VersionChecker = () => {
  useEffect(() => {
    let checking = false;
    const checkVersion = async () => {
      if (checking) return;
      checking = true;
      try {
        const res = await fetch(\`/version.json?t=\${new Date().getTime()}\`, { cache: 'no-store' });
        const data = await res.json();
        
        // @ts-ignore
        if (data.version && typeof __APP_VERSION__ !== 'undefined') {
          // @ts-ignore
          if (data.version.toString() !== __APP_VERSION__.toString()) {
            console.log("Nova versão encontrada, recarregando...");
            window.location.reload(); // Force reload to clear cache
          }
        }
      } catch (e) {
        // Ignora erros (como offline)
      } finally {
        checking = false;
      }
    };

    // Verifica no load inicial
    checkVersion();

    // Verifica ao voltar para a aba
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // E a cada 5 minutos
    const interval = setInterval(checkVersion, 5 * 60 * 1000);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return null;
};
`;

content = content.replace(
  'const App: React.FC = () => {',
  `${checkerCode}\nconst App: React.FC = () => {`
);

content = content.replace(
  '<Router>',
  '<VersionChecker />\n      <Router>'
);

fs.writeFileSync('src/App.tsx', content);
