const fs = require('fs');
let content = fs.readFileSync('src/pages/Landing.tsx', 'utf8');

const target = `  return (
    <div className="p-2 min-w-[220px]">
      <div className="flex items-center gap-2 mb-2">
        <Video size={16} className="text-emerald-500 animate-pulse shrink-0" />
        <div className="flex flex-col">
          <strong className="text-sm font-bold text-zinc-900 leading-tight">
            {locInfo?.bairro}
          </strong>
          <span className="text-xs text-zinc-600 font-medium">
            {locInfo?.cidade} - {locInfo?.estado}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium mb-3">
        <MapPin size={12} className="text-zinc-400" />
        <span>Poste Atalaia de Segurança</span>
      </div>
      <div className="bg-zinc-50 rounded-lg p-2.5 border border-zinc-200 text-center">
        <p className="text-[10px] text-zinc-500 font-extrabold flex items-center justify-center gap-1 uppercase">
          <Lock size={12} className="text-zinc-600" /> Acesso Restrito
        </p>
        <p className="text-[9px] text-zinc-400 mt-1 leading-tight">
          Imagens ao vivo disponíveis exclusivamente para moradores cadastrados na plataforma.
        </p>
      </div>
    </div>
  );`;

const replacement = `  return (
    <div className="w-[230px] flex flex-col gap-2 -m-1">
      <div className="flex items-center gap-2">
        <Video size={16} className="text-emerald-500 animate-pulse shrink-0" />
        <div className="flex flex-col overflow-hidden">
          <strong className="text-sm font-bold text-zinc-900 leading-tight truncate">
            {locInfo?.bairro}
          </strong>
          <span className="text-xs text-zinc-600 font-medium truncate">
            {locInfo?.cidade} - {locInfo?.estado}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium">
        <MapPin size={12} className="text-zinc-400 shrink-0" />
        <span className="truncate">Poste Atalaia de Segurança</span>
      </div>
      <div className="bg-zinc-100/80 rounded-md p-2.5 border border-zinc-200 text-center mt-1 w-full box-border">
        <p className="text-[10px] text-zinc-600 font-extrabold flex items-center justify-center gap-1.5 uppercase mb-1">
          <Lock size={12} className="text-zinc-500" /> Acesso Restrito
        </p>
        <p className="text-[9px] text-zinc-500 leading-relaxed m-0">
          Imagens ao vivo exclusivas para moradores cadastrados na plataforma.
        </p>
      </div>
    </div>
  );`;

content = content.replace(target, replacement);
fs.writeFileSync('src/pages/Landing.tsx', content);
