const fs = require('fs');
let content = fs.readFileSync('src/pages/Landing.tsx', 'utf8');

const target = `<div className="bg-zinc-100/80 rounded-md p-2.5 border border-zinc-200 text-center mt-1 w-full box-border">
        <p className="text-[10px] text-zinc-600 font-extrabold flex items-center justify-center gap-1.5 uppercase mb-1">
          <Lock size={12} className="text-zinc-500" /> Acesso Restrito
        </p>
        <p className="text-[9px] text-zinc-500 leading-relaxed m-0">
          Imagens ao vivo exclusivas para moradores cadastrados na plataforma.
        </p>
      </div>`;

const replacement = `<div className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 rounded-md p-2.5 border border-emerald-200/80 text-center mt-1 w-full box-border shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-500"></div>
        <p className="text-[10px] text-emerald-800 font-extrabold flex items-center justify-center gap-1.5 uppercase mb-1 tracking-wide">
          <ShieldCheck size={14} className="text-emerald-500 animate-pulse drop-shadow-sm" /> Acesso Restrito
        </p>
        <p className="text-[9px] text-emerald-700/90 leading-relaxed m-0 font-medium">
          Imagens ao vivo exclusivas para moradores cadastrados na plataforma.
        </p>
      </div>`;

content = content.replace(target, replacement);
fs.writeFileSync('src/pages/Landing.tsx', content);
