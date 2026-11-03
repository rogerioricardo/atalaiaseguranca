import jsPDF from 'jspdf';

// Helper para converter imagem da pasta public para base64 para o jsPDF
const loadImageAsBase64 = async (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/jpeg', 0.85);
            resolve(dataURL);
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    } catch {
      resolve(null);
    }
  });
};

export interface IntegratorPdfOptions {
  integratorName?: string;
  companyName?: string;
  companyCnpj?: string;
  phone?: string;
}

export const generateIntegratorPdf = async (options: IntegratorPdfOptions = {}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 16;
  const contentWidth = pageWidth - (margin * 2);
  const totalPages = 11;

  // Carrega as imagens reais do sistema em paralelo
  const [imgPlaca, imgCaixa, imgPoste] = await Promise.all([
    loadImageAsBase64('/images/placa_advertencia.jpg'),
    loadImageAsBase64('/images/caixa_hermetica.jpg'),
    loadImageAsBase64('/images/poste_atalaia.jpg')
  ]);

  // Função auxiliar para desenhar o cabeçalho e rodapé padrão a partir da página 2
  const drawPageTemplate = (pageNum: number, sectionTitle: string) => {
    // Linha superior neon
    doc.setFillColor(0, 255, 102); // #00FF66 Neon
    doc.rect(margin, 10, contentWidth, 1.2, 'F');

    // Cabeçalho
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(110, 115, 120);
    doc.text('ATALAIA — SEGURANÇA COLABORATIVA | MANUAL TÉCNICO DO INTEGRADOR', margin, 16);

    doc.setFont('helvetica', 'normal');
    doc.text(sectionTitle.toUpperCase(), pageWidth - margin, 16, { align: 'right' });

    // Linha separadora do cabeçalho
    doc.setDrawColor(225, 230, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, 18, pageWidth - margin, 18);

    // Rodapé
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
    doc.setFontSize(7.5);
    doc.setTextColor(130, 135, 140);
    doc.text('Manual Oficial de Engenharia e Operação — Rede Atalaia de Segurança Comunitária (atalaiadobairro.com.br)', margin, pageHeight - 9);
    doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin, pageHeight - 9, { align: 'right' });
  };

  // ==========================================
  // PÁGINA 1: CAPA OFICIAL (DESIGN TÁTICO PREMIUM)
  // ==========================================
  doc.setFillColor(8, 10, 12); // #080a0c
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Faixa de destaque neon no topo
  doc.setFillColor(0, 255, 102);
  doc.rect(0, 0, pageWidth, 6, 'F');

  // Detalhe decorativo lateral
  doc.setFillColor(0, 255, 102);
  doc.rect(0, 0, 4, pageHeight, 'F');

  // Badge Oficial
  doc.setFillColor(18, 32, 22);
  doc.setDrawColor(0, 255, 102);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin + 4, 24, 118, 8, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 255, 102);
  doc.text('DOCUMENTO TÉCNICO OFICIAL — EDIÇÃO DEFINITIVA (RTMP, CODECS & HTTPS)', margin + 7, 29.5);

  // Título Principal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text('ATALAIA', margin + 4, 46);

  doc.setFontSize(14);
  doc.setTextColor(0, 255, 102);
  doc.text('SEGURANÇA COLABORATIVA', margin + 4, 54);

  // Linha divisória
  doc.setDrawColor(40, 45, 50);
  doc.line(margin + 4, 60, pageWidth - margin, 60);

  // Subtítulo do Manual
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(240, 240, 240);
  doc.text('MANUAL COMPLETO DO INTEGRADOR', margin + 4, 70);
  doc.text('& GUIA AVANÇADO DE INFRAESTRUTURA', margin + 4, 78);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(170, 175, 180);
  const descCapa = 'Guia operacional definitivo: visão geral da plataforma, configuração detalhada de câmeras em RTMP e codecs H.264, servidores de re-streaming e conversão HTTPS, cadastro georreferenciado no painel, montagem de campo, conformidade com a LGPD e gestão de moradores.';
  doc.text(doc.splitTextToSize(descCapa, contentWidth - 8), margin + 4, 87);

  // Imagem de destaque central na capa (Poste ou Placa)
  if (imgPoste || imgPlaca) {
    const bannerImg = imgPoste || imgPlaca;
    if (bannerImg) {
      doc.setDrawColor(0, 255, 102);
      doc.setLineWidth(0.8);
      doc.roundedRect(margin + 4, 106, contentWidth - 8, 86, 3, 3, 'D');
      doc.addImage(bannerImg, 'JPEG', margin + 5, 107, contentWidth - 10, 84);
    }
  }

  // Caixa de Informações do Integrador / Parceiro
  const infoY = 202;
  doc.setFillColor(15, 20, 25);
  doc.setDrawColor(35, 45, 55);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin + 4, infoY, contentWidth - 8, 52, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 255, 102);
  doc.text('DADOS DA EMPRESA HOMOLOGADA & INTEGRADOR RESPONSÁVEL', margin + 10, infoY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(220, 220, 220);

  const nomeInt = options.integratorName || 'Integrador Homologado Atalaia';
  const empInt = options.companyName || 'Empresa Parceira de Monitoramento';
  const cnpjInt = options.companyCnpj ? ` | CNPJ: ${options.companyCnpj}` : '';
  const foneInt = options.phone ? ` | Contato: ${options.phone}` : '';

  doc.text(`Técnico Responsável: ${nomeInt}`, margin + 10, infoY + 16);
  doc.text(`Empresa / Razão Social: ${empInt}${cnpjInt}`, margin + 10, infoY + 23);
  doc.text(`Telefone / WhatsApp: ${foneInt || 'Cadastrado no painel Atalaia'}`, margin + 10, infoY + 30);
  doc.text(`Data de Emissão do Manual: ${new Date().toLocaleDateString('pt-BR')}`, margin + 10, infoY + 37);
  doc.text(`Domínio Oficial do Sistema: atalaiadobairro.com.br`, margin + 10, infoY + 44);

  // Rodapé da capa
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(110, 115, 120);
  doc.text('© Atalaia Tecnologia em Segurança Comunitária — Plataforma Web & Mobile Integrada', margin + 4, pageHeight - 12);

  // ==========================================
  // PÁGINA 2: MÓDULO 1 — VISÃO GERAL COMPLETA & MODELO DE NEGÓCIO
  // ==========================================
  doc.addPage();
  drawPageTemplate(2, 'Módulo 1 — Visão Geral & Negócio');

  let curY = 25;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(10, 10, 10);
  doc.text('1. O Que é a Rede Atalaia e o Modelo Colaborativo', margin, curY);

  curY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  const textoM1 = 'O Atalaia é um ecossistema pioneiro de segurança colaborativa em tempo real focado em bairros, condomínios e perímetros comerciais. Em sistemas tradicionais de CFTV, as gravações ficam isoladas em DVRs fechados e só são consultadas após o crime consumado. No Atalaia, as câmeras instaladas em pontos estratégicos (ruas, esquinas e praças) são integradas em uma malha comunitária ao vivo, com mapa interativo, botão de pânico comunitário e avisos automáticos de segurança no WhatsApp.';
  doc.text(doc.splitTextToSize(textoM1, contentWidth), margin, curY);

  curY += 28;

  // Bloco: Pilares do Negócio do Integrador
  doc.setFillColor(245, 252, 247);
  doc.setDrawColor(0, 190, 80);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, curY, contentWidth, 48, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 130, 50);
  doc.text('COMO O INTEGRADOR RENTABILIZA O PROJETO (FONTES DE RECEITA RECORRENTE):', margin + 4, curY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(40, 40, 40);
  const pilares = [
    '• Receita Recorrente Mensal (MRR): Comissionamento contínuo das assinaturas de moradores nos Planos Família e Premium.',
    '• Split Automático Mercado Pago: Os pagamentos dos moradores caem automaticamente na sua conta bancária sem intermediários.',
    '• Venda e Locação de Hardware: Fornecimento de câmeras IP, caixas herméticas, switches PoE, fontes blindadas e cabeamento.',
    '• Venda e Instalação de Placas Oficiais: Instalação das placas dissuasivas "Área Monitorada 24h" nas residências e esquinas.',
    '• Contratos de Manutenção Preventiva: Mensalidade fixa cobrada da associação de moradores para suporte técnico e limpeza periódica.',
    '• Parceria com Morador Anfitrião: O morador cede ponto de energia (~5W/mês) e internet em troca de isenção e vigilância prioritária.'
  ];
  let pY = curY + 12;
  pilares.forEach(p => {
    doc.text(p, margin + 4, pY);
    pY += 5.6;
  });

  curY += 56;

  // Configuração da Conta de Integrador
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(10, 10, 10);
  doc.text('2. Configuração do Perfil do Integrador e Co-Branding (/profile)', margin, curY);

  curY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  doc.text('Antes de ativar as câmeras nos postes, configure os dados fiscais e o co-branding da sua empresa em "Meu Perfil":', margin, curY);

  curY += 8;

  const camposPerfil = [
    { campo: 'Razão Social e CNPJ', desc: 'Identificação jurídica da sua empresa de segurança/instalação para emissão de notas e contratos.' },
    { campo: 'Chave Pix Oficial', desc: 'Para recebimentos diretos, bonificações de ativação e repasses manuais de associações de moradores.' },
    { campo: 'Logotipo da Empresa (Co-Branding)', desc: 'Sua marca é exibida no topo do sistema ao lado do Atalaia para todos os moradores do seu bairro.' },
    { campo: 'Mercado Pago (Public Key & Access Token)', desc: 'Chaves de API para automatizar o Split de Pagamentos direto para sua conta bancária sem intermediários.' }
  ];

  camposPerfil.forEach(c => {
    doc.setFillColor(250, 251, 253);
    doc.setDrawColor(220, 225, 230);
    doc.roundedRect(margin, curY, contentWidth, 13.5, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(20, 20, 20);
    doc.text(c.campo, margin + 4, curY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(90, 90, 90);
    doc.text(c.desc, margin + 4, curY + 10);

    curY += 15.5;
  });

  // Caixa de Atenção
  curY += 2;
  doc.setFillColor(255, 248, 230);
  doc.setDrawColor(220, 160, 20);
  doc.roundedRect(margin, curY, contentWidth, 18, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(180, 110, 0);
  doc.text('⚠️ ATENÇÃO COM AS CREDENCIAIS DO MERCADO PAGO:', margin + 4, curY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 60, 20);
  doc.text('Utilize sempre as Credenciais de Produção (Production Keys) obtidas em "mercadopago.com.br/developers". O Access Token gerencia o split automático com segurança bancária. Nunca compartilhe suas credenciais.', margin + 4, curY + 11.5);

  // ==========================================
  // PÁGINA 3: MÓDULO 2 — INFRAESTRUTURA FÍSICA DE CAMPO & NORMAS TÉCNICAS
  // ==========================================
  doc.addPage();
  drawPageTemplate(3, 'Módulo 2 — Infraestrutura de Campo');

  curY = 25;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(10, 10, 10);
  doc.text('3. Padrão Técnico de Instalação Física em Campo', margin, curY);

  curY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  doc.text('A estabilidade de um ponto de videomonitoramento de rua depende 100% da montagem física. Siga o Padrão Homologado:', margin, curY);

  curY += 8;

  // Grid com fotos reais lado a lado
  const imgBoxW = (contentWidth - 6) / 2;
  const imgBoxH = 50;

  if (imgCaixa) {
    doc.setDrawColor(200, 205, 210);
    doc.roundedRect(margin, curY, imgBoxW, imgBoxH + 13, 2, 2, 'D');
    doc.addImage(imgCaixa, 'JPEG', margin + 1, curY + 1, imgBoxW - 2, imgBoxH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 30, 30);
    doc.text('CAIXA HERMÉTICA PADRÃO ATALAIA', margin + 3, curY + imgBoxH + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 100, 100);
    doc.text('Fonte blindada 12V 5A, DPS e prensa-cabos no fundo.', margin + 3, curY + imgBoxH + 8.5);
  }

  if (imgPlaca) {
    const pX = margin + imgBoxW + 6;
    doc.setDrawColor(200, 205, 210);
    doc.roundedRect(pX, curY, imgBoxW, imgBoxH + 13, 2, 2, 'D');
    doc.addImage(imgPlaca, 'JPEG', pX + 1, curY + 1, imgBoxW - 2, imgBoxH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 30, 30);
    doc.text('PLACA OFICIAL DE RUA MONITORADA', pX + 3, curY + imgBoxH + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 100, 100);
    doc.text('Dissuasão nas esquinas e portões voluntários.', pX + 3, curY + imgBoxH + 8.5);
  }

  curY += imgBoxH + 19;

  // Lista de Diretrizes Técnicas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(10, 10, 10);
  doc.text('Especificações Homologadas de Campo:', margin, curY);

  curY += 5;
  const specs = [
    { num: '1', tit: 'Caixa Hermética IP66/IP67 e Vedação Estanque:', desc: 'Deve ser instalada a no mínimo 3,5m a 4,5m de altura para evitar vandalismo. Deve conter prensa-cabos emborrachados voltados exclusivamente para baixo (fundo da caixa) para escoamento de umidade e proteção contra chuva torrencial.' },
    { num: '2', tit: 'Proteção Elétrica e DPS (Dispositivo contra Surtos):', desc: 'Instale protetor de surto elétrico (DPS Classe II de 10kA ou 20kA) na entrada da rede 110V/220V e disjuntor unipolar de 6A ou 10A para manutenção segura. Aterrar a carcaça e a blindagem para evitar queima por descargas atmosféricas.' },
    { num: '3', tit: 'Fonte Estabilizada ou Mini-Nobreak UPS 12V:', desc: 'Utilize fonte industrial chaveada 12V 5A estabilizada com filtro anti-ruído ou mini-nobreak 12V 7Ah garantindo autonomia de 2 a 4 horas em eventuais apagões criminosos ou quedas de energia na rua.' },
    { num: '4', tit: 'Cabeamento de Rede 100% Cobre e Blindado:', desc: 'Utilize cabo UTP Cat5e ou Cat6 100% cobre homologado Anatel, com capa preta externa anti-UV e conector RJ45 blindado aterrado. NUNCA utilize cabos de alumínio cobreado (CCA), pois quebram e perdem pacotes.' },
    { num: '5', tit: 'Ângulo Tático de Captura e Visão Noturna:', desc: 'Incline a câmera entre 15° e 25° para baixo. Esse ângulo enquadra calçadas, portões e placas veiculares sem ofuscamento por luz solar direta ou faróis de veículos. Ajuste o IR inteligente ou use tecnologia Full Color com LED quente.' },
    { num: '6', tit: 'Fixação da Placa Oficial Dissuasiva:', desc: 'A placa oficial em alumínio composto (ACM) deve ser parafusada em local visível com o texto "Área Monitorada 24h - Conectada à Rede Comunitária". Garante transparência jurídica e alto poder dissuasivo.' }
  ];

  specs.forEach(s => {
    doc.setFillColor(245, 245, 247);
    doc.circle(margin + 3, curY + 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 140, 50);
    doc.text(s.num, margin + 2.2, curY + 4.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(20, 20, 20);
    doc.text(s.tit, margin + 8, curY + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(70, 70, 70);
    const descLines = doc.splitTextToSize(s.desc, contentWidth - 8);
    doc.text(descLines, margin + 8, curY + 7.5);

    curY += (descLines.length * 3.7) + 5.5;
  });

  // ==========================================
  // PÁGINA 4: MÓDULO 3 — PASSO A PASSO RTMP & AJUSTE RIGOROSO DE CODECS
  // ==========================================
  doc.addPage();
  drawPageTemplate(4, 'Módulo 3 — Configuração RTMP e Codecs');

  curY = 25;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(10, 10, 10);
  doc.text('4. Passo a Passo: Configuração de Câmeras em RTMP', margin, curY);

  curY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  const textoRTMP = 'O RTMP (Real-Time Messaging Protocol - porta TCP 1935) é o padrão de excelência para segurança comunitária ao vivo. No modo Push, a própria câmera IP ou DVR "empurra" o fluxo de vídeo para o servidor em nuvem. Vantagem decisiva: dispensa IP fixo, não exige DDNS e atravessa CGNAT de provedores sem necessidade de abrir portas no roteador do morador voluntário.';
  doc.text(doc.splitTextToSize(textoRTMP, contentWidth), margin, curY);

  curY += 20;

  // Box crítico: Parâmetros de codificação recomendados (Tabela)
  doc.setFillColor(245, 248, 252);
  doc.setDrawColor(30, 100, 200);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, curY, contentWidth, 58, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.setTextColor(15, 60, 140);
  doc.text('PARÂMETROS OBRIGATÓRIOS DE CODIFICAÇÃO (ENCODE / STREAM)', margin + 4, curY + 6);

  const rtmpParams = [
    { item: 'Codec de Vídeo:', valor: 'H.264 (Baseline ou Main Profile). NUNCA USAR H.265 / HEVC nem Smart Codec H.264+.', obs: 'Navegadores HTML5 não suportam H.265 nativo; gera tela preta imediata.' },
    { item: 'Resolução:', valor: '1080p (1920x1080) para Main Stream ou 720p (1280x720) para links restritos.', obs: 'Equilíbrio ideal entre nitidez de placas e consumo de banda.' },
    { item: 'Taxa de Quadros (FPS):', valor: '15 FPS a 20 FPS (Quadros por Segundo).', obs: 'Segurança não exige 60fps; 15fps economiza 50% de banda de upload.' },
    { item: 'Taxa de Bits (Bitrate):', valor: '1500 kbps a 2500 kbps em modo CBR (Constant Bit Rate).', obs: 'CBR impede travamento por oscilação de pico com movimento.' },
    { item: 'Intervalo I-Frame / GOP:', valor: '1x a 2x o FPS (ex: se FPS=15, configure I-Frame = 15 ou 30).', obs: 'Essencial: o player web sincroniza instantaneamente em < 1 segundo!' },
    { item: 'Áudio do Stream:', valor: 'Desativar áudio ou codificar exclusivamente em AAC (64 kbps).', obs: 'Codecs PCM / G.711u / G.711a causam tela preta nos navegadores.' }
  ];

  let rpY = curY + 12;
  rtmpParams.forEach(p => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.6);
    doc.setTextColor(20, 20, 20);
    doc.text(p.item, margin + 4, rpY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 90, 40);
    doc.text(p.valor, margin + 42, rpY);

    doc.setFont('helvetica', 'italic');
    doc.setTextColor(110, 110, 110);
    doc.text(`(${p.obs})`, margin + 42, rpY + 3.6);

    rpY += 7.4;
  });

  curY += 64;

  // Passo a Passo de Configuração nas Marcas Mais Populares
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(10, 10, 10);
  doc.text('Passo a Passo de Ativação do Push RTMP na Câmera:', margin, curY);

  curY += 5;

  const marcasPassos = [
    {
      marca: 'PASSO 1: ACESSO WEB À CÂMERA OU DVR',
      inst: 'Conecte um notebook na mesma rede local da câmera. Abra o navegador e digite o IP local (ex: 192.168.1.108 para Intelbras/Dahua ou 192.168.1.64 para Hikvision). Faça login com usuário e senha de administrador.'
    },
    {
      marca: 'PASSO 2: CONFIGURAÇÃO DE VÍDEO (ENCODE / STREAM)',
      inst: 'Acesse "Configuração > Imagem/Vídeo > Compressão". Mude o Codec de H.265 para H.264. Desmarque opções "Smart Codec" ou "+". Configure Resolução 1080p, FPS 15, Taxa CBR 2048 Kbps e Intervalo de I-Frame em 30.'
    },
    {
      marca: 'PASSO 3: HABILITAÇÃO DO PUSH RTMP NO MENU DE REDE',
      inst: 'Acesse "Rede > RTMP" (ou "Acesso à Plataforma / Transmissão"). Marque "Habilitar RTMP". Selecione "Servidor Personalizado / Custom Server". Insira a URL RTMP completa do servidor de destino e a Chave de Fluxo.'
    },
    {
      marca: 'PASSO 4: ESTRUTURA DA URL DE ENVIO RTMP',
      inst: 'A sintaxe padrão de envio é: rtmp://atalaiadobairro.com.br:1935/live/sua_chave_secreta\nExemplo prático: rtmp://atalaiadobairro.com.br:1935/live/cam_sp_bairro_01 (ou chave fornecida pelo seu servidor de streaming).'
    },
    {
      marca: 'PASSO 5: AVALIAÇÃO DO STATUS DE CONEXÃO',
      inst: 'Clique em "Salvar / Aplicar". Reinicie o stream se necessário. Verifique se o status do RTMP na tela da câmera mudou para "Conectado", "Online" ou "Transmitindo". O servidor de mídia começará a receber os pacotes na hora.'
    }
  ];

  marcasPassos.forEach(m => {
    doc.setFillColor(250, 252, 250);
    doc.setDrawColor(210, 230, 220);
    doc.setLineWidth(0.35);

    const instLines = doc.splitTextToSize(m.inst, contentWidth - 8);
    const boxH = (instLines.length * 3.6) + 9.5;

    doc.roundedRect(margin, curY, contentWidth, boxH, 1.5, 1.5, 'FD');

    doc.setFillColor(0, 180, 70);
    doc.rect(margin, curY, 2.5, boxH, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(0, 120, 50);
    doc.text(m.marca, margin + 5, curY + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.3);
    doc.setTextColor(40, 40, 40);
    doc.text(instLines, margin + 5, curY + 8);

    curY += boxH + 2.8;
  });

  // ==========================================
  // PÁGINA 5: MÓDULO 4 — SERVIDORES DE MÍDIA, RE-STREAMING & HTTPS
  // ==========================================
  doc.addPage();
  drawPageTemplate(5, 'Módulo 4 — Servidores de Mídia & HTTPS');

  curY = 25;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(10, 10, 10);
  doc.text('5. Servidores de Mídia, Re-Streaming e Conversão para HTTPS', margin, curY);

  curY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  const textoRTSP = 'Navegadores web modernos (Chrome, Safari, Firefox, Edge) bloqueiam conexões RTSP brutas (porta 554) e não exibem links HTTP dentro de sites HTTPS devido a regras rígidas de segurança contra "Conteúdo Misto" (Mixed Content). O servidor de re-streaming recebe o sinal da câmera e o converte instantaneamente em fluxos seguros HTTPS (HLS .m3u8, WebRTC WHEP ou iframe seguro).';
  doc.text(doc.splitTextToSize(textoRTSP, contentWidth), margin, curY);

  curY += 22;

  // Servidores de Conversão Homologados
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(10, 10, 10);
  doc.text('Opções Homologadas de Servidores de Re-streaming:', margin, curY);

  curY += 5;

  const solucoesStream = [
    {
      tit: 'OPÇÃO A: SERVIDOR DEDICADO MEDIAMTX / GO2RTC (LATÊNCIA < 1S — HOMOLOGADO)',
      passos: '1. Instale o MediaMTX ou go2rtc na sua VPS Linux (Ubuntu 22.04 / 24.04).\n2. Portas liberadas no firewall: 1935 (RTMP Push), 8554 (RTSP), 8888 (HLS), 8889 (WebRTC).\n3. Aponte a câmera para rtmp://atalaiadobairro.com.br:1935/live/cam01.\n4. O MediaMTX gera o stream HLS seguro: https://atalaiadobairro.com.br/live/cam01/index.m3u8.'
    },
    {
      tit: 'OPÇÃO B: SERVIÇOS EM NUVEM PRONTOS (RTSP.ME / MISTERSERVER)',
      passos: '1. Crie uma conta no rtsp.me ou mistersrv.\n2. Insira o link RTSP com IP externo ou DNS Dinâmico da câmera (ex: rtsp://atalaiadobairro.com.br:554/cam1).\n3. O serviço gera um link HTTPS criptografado com Iframe pronto (ex: https://rtsp.me/embed/XYZ123/).\n4. Cole esse link direto no campo "Código Iframe ou Link" do Atalaia.'
    },
    {
      tit: 'OPÇÃO C: YOUTUBE LIVE NÃO-LISTADO (CUSTO ZERO E ARMAZENAMENTO ILIMITADO)',
      passos: '1. No YouTube Studio, crie uma transmissão ao vivo contínua configurada como "Não Listada".\n2. Na câmera ou DVR, aponte o Push RTMP para rtmp://a.rtmp.youtube.com/live2 com a chave da live.\n3. Obtenha o link do YouTube (ex: https://www.youtube.com/watch?v=ABC123XYZ).\n4. O Atalaia converte automaticamente o YouTube em player tático sem anúncios e em loop contínuo.'
    }
  ];

  solucoesStream.forEach(s => {
    doc.setFillColor(252, 252, 254);
    doc.setDrawColor(215, 220, 230);
    const sLines = doc.splitTextToSize(s.passos, contentWidth - 8);
    const sH = (sLines.length * 3.5) + 9.5;

    doc.roundedRect(margin, curY, contentWidth, sH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(30, 80, 180);
    doc.text(s.tit, margin + 4, curY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(50, 50, 50);
    doc.text(sLines, margin + 4, curY + 8.5);

    curY += sH + 3.5;
  });

  curY += 2;

  // Box: Configuração de SSL e Headers CORS
  doc.setFillColor(245, 250, 255);
  doc.setDrawColor(50, 120, 220);
  doc.roundedRect(margin, curY, contentWidth, 34, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(20, 60, 160);
  doc.text('🔒 CERTIFICADO SSL/TLS (CERTBOT) E CABEÇALHOS CORS NO NGINX:', margin + 4, curY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(40, 50, 70);
  const corsDesc = 'Para servir HLS sem bloqueios de segurança no domínio atalaiadobairro.com.br, configure o Nginx como proxy reverso com certificado gratuito Let\'s Encrypt:\n\nsudo certbot --nginx -d atalaiadobairro.com.br\n\nAdicione no bloco location /live do Nginx:\nadd_header Access-Control-Allow-Origin *;\nadd_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS";';
  doc.text(doc.splitTextToSize(corsDesc, contentWidth - 8), margin + 4, curY + 9.5);

  curY += 38;

  // Alerta de Conteúdo Misto
  doc.setFillColor(255, 245, 235);
  doc.setDrawColor(240, 140, 40);
  doc.roundedRect(margin, curY, contentWidth, 18, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(190, 80, 0);
  doc.text('🔒 REGRA DE OURO: SEMPRE UTILIZE HTTPS (SSL) NO LINK FINAL DO ATALAIA', margin + 4, curY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(80, 40, 0);
  doc.text('Se o link começar com http:// em vez de https://, o Chrome bloqueará a imagem por "Conteúdo Misto". Para links HTTP legados, o Atalaia disponibiliza o botão "Monitor Externo" que abre o stream em popup isolada.', margin + 4, curY + 9);

  // ==========================================
  // PÁGINA 6: MÓDULO 5 — SINTAXE DE CONEXÃO DAS CÂMERAS (RTSP E RTMP)
  // ==========================================
  doc.addPage();
  drawPageTemplate(6, 'Módulo 5 — Sintaxe RTSP & RTMP');

  curY = 25;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(10, 10, 10);
  doc.text('6. Sintaxe de Conexão das Câmeras (RTSP, RTMP e Fabricantes)', margin, curY);

  curY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  doc.text('Consulte a sintaxe exata das principais marcas do mercado para apontar fluxos locais ou em nuvem para o domínio atalaiadobairro.com.br:', margin, curY);

  curY += 8;

  const rtspMarcas = [
    { 
      fabricante: 'Intelbras / Dahua (Câmeras IP e NVRs Multi-HD):', 
      url: 'rtsp://admin:senha@atalaiadobairro.com.br:554/cam/realmonitor?channel=1&subtype=0', 
      desc: 'Canal 1, Subtype 0 = Fluxo Principal Full HD 1080p. Subtype 1 = Fluxo Secundário (Sub-stream).' 
    },
    { 
      fabricante: 'Hikvision / Hilook (Linha Turbo HD e IP):', 
      url: 'rtsp://admin:senha@atalaiadobairro.com.br:554/Streaming/Channels/101', 
      desc: 'Canal 1, Stream Principal = 101. Stream Secundário = 102. Canal 2 = 201.' 
    },
    { 
      fabricante: 'Câmeras Wi-Fi ONVIF (Yoosee, ICSee, Tuya, V380):', 
      url: 'rtsp://admin:senha@atalaiadobairro.com.br:554/onvif1   ou   /live/ch0', 
      desc: 'Padrão ONVIF universal na porta 554 (autenticação Digest ou Basic ativa).' 
    },
    { 
      fabricante: 'Speed Domes e Câmeras PTZ com Zoom:', 
      url: 'rtsp://admin:senha@atalaiadobairro.com.br:554/Streaming/Channels/101', 
      desc: 'Transmissão do canal com controle de movimento e preset salvos no NVR.' 
    },
    { 
      fabricante: 'DVRs Multi-Canais (Intelbras / Hikvision / Dahua):', 
      url: 'rtsp://admin:senha@atalaiadobairro.com.br:554/cam/realmonitor?channel=3&subtype=0', 
      desc: 'Substitua "channel=X" pelo número da entrada BNC conectada no aparelho.' 
    }
  ];

  rtspMarcas.forEach(r => {
    doc.setFillColor(248, 249, 251);
    doc.setDrawColor(220, 225, 230);
    doc.roundedRect(margin, curY, contentWidth, 14, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 60, 130);
    doc.text(r.fabricante, margin + 4, curY + 4.5);

    doc.setFont('courier', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(0, 110, 50);
    doc.text(r.url, margin + 4, curY + 8.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 100, 100);
    doc.text(r.desc, margin + 4, curY + 12);

    curY += 16.5;
  });

  curY += 4;

  // Box: Dicionário de Portas de Rede e Roteamento
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(10, 10, 10);
  doc.text('Dicionário de Portas Padrão de Telecom & CFTV:', margin, curY);

  curY += 5;

  const portasInfo = [
    { porta: '1935 TCP', serv: 'RTMP (Real-Time Messaging Protocol)', desc: 'Envio push da câmera para a nuvem. Não precisa de redirecionamento no roteador.' },
    { porta: '554 TCP/UDP', serv: 'RTSP (Real-Time Streaming Protocol)', desc: 'Stream local de fábrica da câmera IP ou DVR para o servidor de re-streaming.' },
    { porta: '443 TCP', serv: 'HTTPS / WSS / SSL', desc: 'Canal criptografado seguro para visualização dos moradores no navegador e app.' },
    { porta: '8888 TCP', serv: 'HLS (HTTP Live Streaming)', desc: 'Porta padrão do MediaMTX para entrega dos manifestos .m3u8 e segmentos .ts.' },
    { porta: '37777 TCP', serv: 'Porta de Serviço Intelbras', desc: 'Porta proprietária para comunicação com softwares SIM Next e ISIC.' },
    { porta: '8000 TCP', serv: 'Porta de Serviço Hikvision SDK', desc: 'Porta proprietária para comunicação com software iVMS-4200 e Hik-Connect.' }
  ];

  portasInfo.forEach(p => {
    doc.setFillColor(252, 252, 254);
    doc.setDrawColor(230, 235, 240);
    doc.roundedRect(margin, curY, contentWidth, 10.5, 1, 1, 'FD');

    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 120, 60);
    doc.text(p.porta, margin + 3, curY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(20, 20, 20);
    doc.text(p.serv, margin + 28, curY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(90, 90, 90);
    doc.text(p.desc, margin + 28, curY + 8.5);

    curY += 12;
  });

  // ==========================================
  // PÁGINA 7: MÓDULO 6 — CADASTRO E HOMOLOGAÇÃO NO PAINEL ATALAIA
  // ==========================================
  doc.addPage();
  drawPageTemplate(7, 'Módulo 6 — Cadastro no Painel');

  curY = 25;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(10, 10, 10);
  doc.text('7. Cadastro e Georreferenciamento de Câmeras no Atalaia (/cameras)', margin, curY);

  curY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  doc.text('No menu "Gestão de Câmeras", o integrador homologado cadastra a câmera seguindo 6 passos essenciais:', margin, curY);

  curY += 8;

  const passosCam = [
    {
      passo: 'PASSO 1: VINCULAR AO BAIRRO CORRETO',
      detalhes: 'Selecione o bairro onde a câmera física foi instalada. Se for uma nova rua/zona, clique em "Gerenciar Bairros" para cadastrá-la com um clique antes de vincular o ponto.'
    },
    {
      passo: 'PASSO 2: NOMENCLATURA TÁTICA E CLARA',
      detalhes: 'Nomeie a câmera seguindo o padrão de fácil identificação comunitária. Exemplos: "CAM 01 - Av. Brasil x Rua das Acácias", "CAM 02 - Praça Central (Ao Vivo)", "CAM 03 - Portaria Norte".'
    },
    {
      passo: 'PASSO 3: CÓDIGO DO STREAM / LINK DE VÍDEO (HTTPS)',
      detalhes: 'Cole o link gerado nos passos anteriores. Aceita:\n• Links diretos HLS (.m3u8) e WebRTC WHEP em HTTPS\n• Códigos Iframe completos (<iframe src="https://..."></iframe>)\n• Transmissões ao vivo do YouTube Live Não-Listadas (auto-embed sem anúncios)\n• Links gerados por servidores de re-streaming (ex: https://atalaiadobairro.com.br/live/cam01/index.m3u8).'
    },
    {
      passo: 'PASSO 4: GEORREFERENCIAMENTO NO MAPA (LATITUDE E LONGITUDE)',
      detalhes: 'O integrador pode clicar diretamente sobre o mapa interativo para marcar o ponto exato do poste. As coordenadas (Lat e Lng) são preenchidas automaticamente e geram o pino verde luminoso no mapa dos moradores.'
    },
    {
      passo: 'PASSO 5: VINCULAÇÃO DO MORADOR ANFITRIÃO VOLUNTÁRIO',
      detalhes: 'Preencha o nome, telefone de contato e endereço da residência que forneceu o ponto de energia elétrica e acesso à internet. Isso garante suporte rápido em caso de manutenção.'
    },
    {
      passo: 'PASSO 6: PRONTUÁRIO FOTOGRÁFICO DE INSTALAÇÃO E MANUTENÇÃO',
      detalhes: 'Anexe a foto da fachada/poste onde a câmera está fixada e a foto interna da caixa hermética. Isso cria o prontuário técnico de garantia, histórico de manutenções e facilita suporte de outros técnicos da equipe.'
    }
  ];

  passosCam.forEach(p => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(215, 225, 235);
    doc.setLineWidth(0.4);

    const txtLines = doc.splitTextToSize(p.detalhes, contentWidth - 10);
    const cardH = (txtLines.length * 3.6) + 10.5;

    doc.roundedRect(margin, curY, contentWidth, cardH, 2, 2, 'FD');

    // Barra lateral verde
    doc.setFillColor(0, 200, 80);
    doc.rect(margin, curY, 3, cardH, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 130, 60);
    doc.text(p.passo, margin + 6, curY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.4);
    doc.setTextColor(50, 50, 50);
    doc.text(txtLines, margin + 6, curY + 8.5);

    curY += cardH + 3.2;
  });

  // ==========================================
  // PÁGINA 8: MÓDULO 7 — BLINDAGEM JURÍDICA, LGPD & MÁSCARAS DE PRIVACIDADE
  // ==========================================
  doc.addPage();
  drawPageTemplate(8, 'Módulo 7 — LGPD & Máscaras');

  curY = 25;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(10, 10, 10);
  doc.text('8. Lei Geral de Proteção de Dados (LGPD) e Máscaras Digitais', margin, curY);

  curY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  const textoLGPD = 'A Lei nº 13.709/2018 (LGPD) e o Código Civil protegem a intimidade, privacidade e imagem dos cidadãos. O Atalaia monitora exclusivamente o espaço público comunitário (ruas, calçadas e vias públicas). É terminantemente proibido transmitir o interior de residências particulares, garagens privativas, janelas de quartos, sacadas, quintais ou piscinas particulares.';
  doc.text(doc.splitTextToSize(textoLGPD, contentWidth), margin, curY);

  curY += 22;

  // Caixa de Blindagem Jurídica
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(239, 68, 68);
  doc.roundedRect(margin, curY, contentWidth, 24, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.setTextColor(185, 28, 28);
  doc.text('🛡️ PROCEDIMENTO OBRIGATÓRIO DE HOMOLOGAÇÃO JURÍDICA:', margin + 4, curY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(127, 29, 29);
  const avisoLGPD = 'Toda câmera cadastrada por você deve passar pelo ajuste de Máscaras Pretas de Privacidade antes de ser liberada aos moradores. Câmeras sem máscara que exibam áreas particulares sujeitam o integrador e o condomínio a sanções cíveis e criminais.';
  doc.text(doc.splitTextToSize(avisoLGPD, contentWidth - 8), margin + 4, curY + 11.5);

  curY += 30;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(10, 10, 10);
  doc.text('Como Operar a Ferramenta Tática de Máscaras no Painel:', margin, curY);

  curY += 6;

  const passosMasc = [
    {
      num: 'A',
      tit: 'Acesso à Ferramenta de Privacidade:',
      desc: 'No card da câmera desejada em "Gestão de Câmeras", clique no ícone de escudo / cadeado ("Máscaras de Privacidade"). Disponível exclusivamente para Integradores e Administradores.'
    },
    {
      num: 'B',
      tit: 'Modo Retângulo (Janelas, Portas e Sacadas):',
      desc: 'Clique em "Adicionar Retângulo" e arraste o mouse sobre a área privada da imagem (como janelas de vizinhos, portões fechados ou sacadas). Redimensione com precisão cirúrgica.'
    },
    {
      num: 'C',
      tit: 'Modo Polígono (Muros em Declive e Áreas Irregulares):',
      desc: 'Clique em "Criar Polígono" e dê cliques sobre a imagem marcando cada vértice do muro ou quintal vizinho. O sistema conecta os pontos e preenche com máscara preta opaca intransponível.'
    },
    {
      num: 'D',
      tit: 'Salvamento e Sincronização em Nuvem:',
      desc: 'Clique em "Salvar Máscaras". As áreas bloqueadas são persistidas instantaneamente no banco de dados e sobrepostas em todas as telas de todos os moradores do bairro no mesmo segundo.'
    }
  ];

  passosMasc.forEach(m => {
    doc.setFillColor(250, 250, 252);
    doc.setDrawColor(225, 230, 235);
    const dLines = doc.splitTextToSize(m.desc, contentWidth - 14);
    const mH = (dLines.length * 3.6) + 10.5;

    doc.roundedRect(margin, curY, contentWidth, mH, 1.5, 1.5, 'FD');

    doc.setFillColor(0, 0, 0);
    doc.circle(margin + 5, curY + 5.5, 3.2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 255, 102);
    doc.text(m.num, margin + 3.8, curY + 6.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(20, 20, 20);
    doc.text(m.tit, margin + 11, curY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(70, 70, 70);
    doc.text(dLines, margin + 11, curY + 9.5);

    curY += mH + 3.2;
  });

  // ==========================================
  // PÁGINA 9: MÓDULO 8 — GESTÃO DE MORADORES, AUTOMAÇÃO WHATSAPP & PÂNICO
  // ==========================================
  doc.addPage();
  drawPageTemplate(9, 'Módulo 8 — Moradores & WhatsApp');

  curY = 25;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(10, 10, 10);
  doc.text('9. Gestão de Moradores, Assinaturas e Automação WhatsApp', margin, curY);

  curY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  doc.text('No painel "Gestão de Moradores" (/integrator/users), você acompanha a base da comunidade e a automação de notificações:', margin, curY);

  curY += 7;

  const abas = [
    { nome: 'TODOS OS MORADORES', desc: 'Visão unificada de toda a base cadastrada no seu bairro com nome, e-mail, WhatsApp e status de acesso.' },
    { nome: 'EM DEGUSTAÇÃO (TRIAL)', desc: 'Moradores em período de teste gratuito (7 a 15 dias) com contagem regressiva para incentivar a conversão.' },
    { nome: 'ASSINANTES PAGOS', desc: 'Moradores ativos nos planos Família/Premium que geram o seu Split de faturamento mensal recorrente.' },
    { nome: 'MORADORES FREE', desc: 'Usuários com plano gratuito que visualizam apenas informações básicas de segurança comunitária.' }
  ];

  abas.forEach(a => {
    doc.setFillColor(248, 249, 250);
    doc.setDrawColor(210, 215, 220);
    doc.roundedRect(margin, curY, contentWidth, 12, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 100, 200);
    doc.text(a.nome, margin + 4, curY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.3);
    doc.setTextColor(60, 60, 60);
    doc.text(a.desc, margin + 4, curY + 9);

    curY += 14.5;
  });

  curY += 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(10, 10, 10);
  doc.text('Central de Notificações WhatsApp (Whaticket Integrado):', margin, curY);

  curY += 5;

  const zaps = [
    {
      tipo: '🚨 BOTÃO DE PÂNICO E EMERGÊNCIA',
      msg: 'Dispara alerta com localização exata no WhatsApp dos vizinhos cadastrados e administradores em milissegundos.'
    },
    {
      tipo: '🔐 AVISO DE ACESSO E SEGURANÇA',
      msg: 'Notifica no WhatsApp a confirmação de login no sistema com data e hora para proteção de conta.'
    },
    {
      tipo: '🛡️ BOAS-VINDAS E LINK DE ACESSO',
      msg: 'Envia mensagem automática com guia de primeiros passos ao novo morador que se cadastra no bairro.'
    }
  ];

  zaps.forEach(z => {
    doc.setFillColor(245, 252, 248);
    doc.setDrawColor(37, 211, 102);
    doc.setLineWidth(0.35);
    const zLines = doc.splitTextToSize(z.msg, contentWidth - 8);
    const zH = (zLines.length * 3.5) + 9.5;

    doc.roundedRect(margin, curY, contentWidth, zH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(18, 140, 65);
    doc.text(z.tipo, margin + 4, curY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.3);
    doc.setTextColor(40, 50, 45);
    doc.text(zLines, margin + 4, curY + 8.5);

    curY += zH + 3.2;
  });

  curY += 3;
  doc.setFillColor(240, 245, 255);
  doc.setDrawColor(50, 100, 200);
  doc.roundedRect(margin, curY, contentWidth, 18, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(20, 60, 150);
  doc.text('CONTROLE DE DISPAROS E ANTI-SPAM (COOLDOWN AUTOMÁTICO):', margin + 4, curY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(40, 50, 80);
  doc.text('O sistema possui motor inteligente de cooldown anti-duplicação (janela de 5 minutos) para evitar múltiplos disparos repetidos no WhatsApp do morador ou do integrador, prevenindo bloqueios do chip pela Meta.', margin + 4, curY + 9.5);

  // ==========================================
  // PÁGINA 10: MÓDULO 9 — DIAGNÓSTICO AVANÇADO DE FALHAS (TROUBLESHOOTING)
  // ==========================================
  doc.addPage();
  drawPageTemplate(10, 'Módulo 9 — Troubleshooting Técnico');

  curY = 25;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(10, 10, 10);
  doc.text('10. Guia Avançado de Diagnóstico de Falhas (Troubleshooting)', margin, curY);

  curY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  doc.text('Tabela diagnóstica para resolução imediata dos 5 problemas mais comuns em instalações de rua:', margin, curY);

  curY += 8;

  const troubles = [
    {
      sintoma: '1. TELA PRETA NO NAVEGADOR OU ERRO "THE MEDIA COULD NOT BE LOADED"',
      causa: 'Link configurado em HTTP (bloqueado por Mixed Content em sites HTTPS), codec H.265 ativo, ou áudio PCM.',
      solucao: 'Migre o stream para HTTPS. Na câmera, configure Codec em H.264 Baseline, desative Smart Codec e desative o áudio ou mude para AAC.'
    },
    {
      sintoma: '2. ATRASO (DELAY) EXCESSIVO DE 10 A 20 SEGUNDOS NA IMAGEM AO VIVO',
      causa: 'Intervalo de Keyframe (I-Frame / GOP) configurado com valor muito alto (ex: 60 a 120 quadros).',
      solucao: 'Acesse o menu de Compressão da câmera e ajuste o Intervalo de I-Frame para 15 ou 30 (1x a 2x a taxa de FPS).'
    },
    {
      sintoma: '3. VÍDEO SOFRENDO CONGELAMENTOS, PIXELIZAÇÃO OU BUFFERING',
      causa: 'Taxa de bits configurada em VBR (Bitrate Variável) com picos que superam o upload da internet do anfitrião.',
      solucao: 'Configure o Bitrate estritamente em CBR (Constant Bit Rate) entre 1500 e 2048 Kbps. Certifique-se de pelo menos 3 Mbps de upload estável.'
    },
    {
      sintoma: '4. CÂMERA FICA OFFLINE DURANTE CHUVAS FORTES OU TEMPESTADES',
      causa: 'Infiltração de umidade no conector RJ45 (falta de fita de autofusão) ou desarme de disjuntor por surto na rede.',
      solucao: 'Aplique fita de autofusão de borracha sobre o conector RJ45, instale prensa-cabos virados para baixo e instale DPS de 10kA na alimentação.'
    },
    {
      sintoma: '5. CONEXÃO COM CGNAT IMPEDINDO ACESSO POR RTSP EXTERNO',
      causa: 'Operadora de internet fornece IP compartilhado (CGNAT) e não permite abertura de portas no roteador residencial.',
      solucao: 'Utilize Push RTMP na porta TCP 1935. Como a câmera envia de dentro para fora, o RTMP atravessa 100% dos CGNATs sem configuração de portas.'
    }
  ];

  troubles.forEach(t => {
    doc.setFillColor(252, 252, 254);
    doc.setDrawColor(215, 220, 230);

    const cLines = doc.splitTextToSize(`Causa Raiz: ${t.causa}`, contentWidth - 10);
    const sLines = doc.splitTextToSize(`Solução Técnica: ${t.solucao}`, contentWidth - 10);
    const boxH = (cLines.length * 3.4) + (sLines.length * 3.4) + 12;

    doc.roundedRect(margin, curY, contentWidth, boxH, 1.5, 1.5, 'FD');

    // Barra lateral de alerta
    doc.setFillColor(220, 100, 20);
    doc.rect(margin, curY, 2.5, boxH, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(190, 70, 0);
    doc.text(t.sintoma, margin + 5, curY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(60, 60, 60);
    doc.text(cLines, margin + 5, curY + 8.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(0, 120, 50);
    doc.text(sLines, margin + 5, curY + 8.5 + (cLines.length * 3.4) + 1);

    curY += boxH + 3.2;
  });

  // ==========================================
  // PÁGINA 11: MÓDULO 10 — CHECKLIST DE HOMOLOGAÇÃO, ENTREGA TÉCNICA E TERMO
  // ==========================================
  doc.addPage();
  drawPageTemplate(11, 'Módulo 10 — Checklist & Homologação');

  curY = 25;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(10, 10, 10);
  doc.text('11. Checklist de Homologação da Rua e Termo de Entrega', margin, curY);

  curY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(60, 60, 60);
  doc.text('Antes de liberar o monitoramento para os moradores, o integrador deve checar cada item:', margin, curY);

  curY += 6;

  const checks = [
    'Caixa hermética IP66/IP67 fixada com segurança a mais de 3,5m e prensa-cabos no fundo.',
    'Protetor de surto elétrico (DPS Classe II de 10kA/20kA) e disjuntor unipolar aterrados.',
    'Cabeamento de rede UTP Cat5e/Cat6 100% cobre homologado Anatel com conector blindado.',
    'Fonte chaveada 12V 5A estabilizada ou mini-nobreak 12V com autonomia mínima de 2 horas.',
    'Câmera configurada estritamente em H.264 (sem H.265), FPS 15, CBR 2048kbps e GOP 30.',
    'Push RTMP apontado para rtmp://atalaiadobairro.com.br:1935/live/... com status Online.',
    'Stream HTTPS (HLS ou WebRTC) testado no Chrome sem erro de Mixed Content ou CORS.',
    'Coordenadas de Latitude e Longitude georreferenciadas com precisão no mapa do Atalaia.',
    'MÁSCARAS DE PRIVACIDADE LGPD aplicadas sobre todas as janelas e áreas particulares vizinhas.',
    'Fotos do poste e da montagem interna da caixa anexadas no prontuário técnico da câmera.',
    'Placa oficial "Área Monitorada 24h" parafusada em local visível para pedestres e veículos.',
    'Dados bancários e credenciais Mercado Pago configuradas para recebimento do Split mensal.'
  ];

  checks.forEach((c, idx) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(200, 205, 210);
    doc.roundedRect(margin, curY, contentWidth, 7.2, 1, 1, 'FD');

    // Quadrado de checkbox
    doc.setDrawColor(0, 180, 80);
    doc.setLineWidth(0.5);
    doc.rect(margin + 2.5, curY + 1.7, 3.6, 3.6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(30, 30, 30);
    doc.text(`[  ] ${idx + 1}. ${c}`, margin + 8, curY + 4.6);

    curY += 8.6;
  });

  curY += 5;

  // Termo de Responsabilidade Técnica
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(210, 215, 220);
  doc.roundedRect(margin, curY, contentWidth, 44, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(10, 10, 10);
  doc.text('TERMO DE RESPONSABILIDADE E CONFORMIDADE TÉCNICA', margin + 4, curY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.3);
  doc.setTextColor(70, 70, 70);
  const termoTxt = 'Declaro que as instalações físicas, parâmetros de codificação RTMP/RTSP e configurações lógicas executadas nesta malha comunitária cumprem integralmente as exigências técnicas de segurança elétrica, normas da ABNT e a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). As máscaras de privacidade foram aplicadas e o ponto está homologado para operação comercial.';
  doc.text(doc.splitTextToSize(termoTxt, contentWidth - 8), margin + 4, curY + 11.5);

  // Linhas para assinatura
  const sigY = curY + 31;
  doc.line(margin + 6, sigY, margin + 76, sigY);
  doc.line(pageWidth - margin - 76, sigY, pageWidth - margin - 6, sigY);

  doc.setFontSize(6.8);
  doc.setTextColor(90, 90, 90);
  doc.text('Assinatura do Integrador Técnico Homologado', margin + 8, sigY + 4);
  doc.text('Coordenação Técnica Nacional Atalaia / Associação', pageWidth - margin - 74, sigY + 4);

  // Download do arquivo
  doc.save('Manual_Completo_do_Integrador_Atalaia.pdf');
};
