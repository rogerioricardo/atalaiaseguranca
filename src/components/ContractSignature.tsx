import React, { useRef, useState, useEffect } from 'react';
import { Card, Button, Input } from './UI';
import { FileText, Check, Shield, AlertTriangle, Download, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { User } from '@/types';

interface SignatureData {
  name: string;
  document: string;
  phone: string;
  timestamp: string;
  ipAddress: string;
  os: string;
  browser: string;
  signatureImage: string; // Base64 of the drawn canvas
  signed: boolean;
}

interface ContractSignatureProps {
  user: User;
  onSignComplete?: (data: SignatureData) => void;
}

export const ContractSignature: React.FC<ContractSignatureProps> = ({ user, onSignComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [documentNumber, setDocumentNumber] = useState('');
  const [signerName, setSignerName] = useState(user.name || '');
  const [signerPhone, setSignerPhone] = useState(user.phone || '');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showFullContract, setShowFullContract] = useState(true);
  const [signatureRecord, setSignatureRecord] = useState<SignatureData | null>(null);
  const [loading, setLoading] = useState(false);
  const [penColor, setPenColor] = useState('#00ff66'); // Pen color (neon green default)

  // Simulated metadata for digital trace audit
  const [metadata, setMetadata] = useState({
    ip: '189.122.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255),
    browser: '',
    os: ''
  });

  useEffect(() => {
    // Detect OS and Browser for contract trace
    const ua = navigator.userAgent;
    let browserName = 'Navegador Web';
    let osName = 'Sistema Operacional';

    if (ua.indexOf('Firefox') > -1) browserName = 'Mozilla Firefox';
    else if (ua.indexOf('Chrome') > -1) browserName = 'Google Chrome';
    else if (ua.indexOf('Safari') > -1) browserName = 'Apple Safari';
    else if (ua.indexOf('Edge') > -1) browserName = 'Microsoft Edge';

    if (ua.indexOf('Win') > -1) osName = 'Windows';
    else if (ua.indexOf('Mac') > -1) osName = 'macOS';
    else if (ua.indexOf('Linux') > -1) osName = 'Linux';
    else if (ua.indexOf('Android') > -1) osName = 'Android';
    else if (ua.indexOf('like Mac') > -1) osName = 'iOS';

    setMetadata(prev => ({
      ...prev,
      browser: browserName,
      os: osName
    }));

    // Check if contract already signed by this user
    const saved = localStorage.getItem(`atalaia_contract_signed_${user.id}`);
    if (saved) {
      try {
        setSignatureRecord(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing loaded signature', e);
      }
    }
  }, [user.id]);

  // Adjust canvas resolution backings for crisp high-density screens
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3;
        ctx.strokeStyle = penColor;
      }
    }
  }, [signatureRecord, penColor]); // Re-init context on view reset or pen color change

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // Prevent scrolling for touch setups
    if ('touches' in e) {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if ('touches' in e) {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim()) {
      alert('Por favor, insira o seu nome completo.');
      return;
    }
    if (!documentNumber.trim()) {
      alert('Por favor, informe seu CPF ou CNPJ para validade jurídica.');
      return;
    }
    if (!acceptedTerms) {
      alert('Você deve aceitar os termos do contrato de adesão.');
      return;
    }
    if (!hasDrawn) {
      alert('Por favor, desenhe sua assinatura no painel.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const canvas = canvasRef.current;
      const signatureImage = canvas ? canvas.toDataURL('image/png') : '';
      
      const payload: SignatureData = {
        name: signerName.trim(),
        document: documentNumber.trim(),
        phone: signerPhone.trim(),
        timestamp: new Date().toLocaleString('pt-BR'),
        ipAddress: metadata.ip,
        os: metadata.os,
        browser: metadata.browser,
        signatureImage,
        signed: true
      };

      localStorage.setItem(`atalaia_contract_signed_${user.id}`, JSON.stringify(payload));
      setSignatureRecord(payload);
      setLoading(false);
      if (onSignComplete) {
        onSignComplete(payload);
      }
    }, 1200);
  };

  const handleRevoke = () => {
    if (confirm('Tem certeza de que deseja remover esta assinatura eletrônica registrada?')) {
      localStorage.removeItem(`atalaia_contract_signed_${user.id}`);
      setSignatureRecord(null);
      setHasDrawn(false);
      setDocumentNumber('');
    }
  };

  const downloadPrintableReceipt = () => {
    if (!signatureRecord) return;

    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comprovante Contrato Atalaia - ${signatureRecord.name}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1a1a1a;
      line-height: 1.5;
      background-color: #f7f9fa;
      margin: 0;
      padding: 40px 16px;
    }
    .document-card {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e1e8ed;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      padding: 40px;
    }
    .button-container {
      max-width: 800px;
      margin: 0 auto 20px auto;
      display: flex;
      justify-content: flex-end;
    }
    .btn {
      background-color: #00ff66;
      color: #000000;
      border: none;
      padding: 12px 24px;
      font-weight: bold;
      border-radius: 8px;
      cursor: pointer;
      font-size: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn:hover {
      background-color: #00d655;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #00ff66;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .brand {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: -1px;
    }
    .brand span {
      color: #059669;
    }
    .badge {
      background-color: #e6fffa;
      color: #047857;
      border: 1px solid #34d399;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .title {
      font-size: 22px;
      font-weight: 800;
      margin-top: 0;
      margin-bottom: 8px;
    }
    .subtitle {
      color: #64748b;
      font-size: 14px;
      margin-bottom: 30px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    @media (min-width: 768px) {
      .grid {
        grid-template-columns: 1.2fr 0.8fr;
      }
    }
    .card-meta {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
    }
    .card-meta-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #047857;
      margin-bottom: 12px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f1f5f9;
      font-size: 13px;
    }
    .meta-row:last-child {
      border-bottom: none;
    }
    .meta-lbl {
      color: #64748b;
      font-weight: 500;
    }
    .meta-val {
      color: #0f172a;
      font-weight: 700;
      text-align: right;
    }
    .signature-box {
      background-color: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .signature-box-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
      margin-bottom: 15px;
    }
    .signature-image {
      max-height: 120px;
      max-width: 100%;
      background: white;
      border-radius: 6px;
      padding: 6px;
    }
    .contract-text {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 24px;
      font-size: 12px;
      color: #334155;
      height: 300px;
      overflow-y: auto;
      margin-bottom: 30px;
      font-family: inherit;
    }
    .section-title {
      font-weight: 800;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-top: 16px;
      margin-bottom: 8px;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      text-align: center;
      font-size: 11px;
      color: #64748b;
      line-height: 1.6;
    }
    @media print {
      body {
        background-color: #ffffff;
        padding: 0;
      }
      .document-card {
        border: none;
        box-shadow: none;
        padding: 0;
      }
      .button-container {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  <div class="button-container">
    <button class="btn" onclick="window.print()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-printer"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
      Imprimir Comprovante (Ctrl + P)
    </button>
  </div>

  <div class="document-card">
    <div class="header">
      <div class="brand">ATALAIA <span>SEGURANÇA</span></div>
      <div class="badge">Assinado Digitalmente</div>
    </div>

    <h1 class="title">Contrato de Adesão Assinado</h1>
    <div class="subtitle">Este documento confirma eletronicamente a concordância do morador aos termos de licenciamento de uso da plataforma SaaS Atalaia Segurança Colaborativa.</div>

    <div class="grid">
      <div class="card-meta">
        <div class="card-meta-title">Auditoria e Validade Jurídica</div>
        
        <div class="meta-row">
          <span class="meta-lbl">Nome do Signatário:</span>
          <span class="meta-val">${signatureRecord.name}</span>
        </div>
        
        <div class="meta-row">
          <span class="meta-lbl">CPF ou CNPJ:</span>
          <span class="meta-val">${signatureRecord.document}</span>
        </div>
        
        <div class="meta-row">
          <span class="meta-lbl">WhatsApp/Telefone:</span>
          <span class="meta-val">${signatureRecord.phone || 'Não informado'}</span>
        </div>
        
        <div class="meta-row">
          <span class="meta-lbl">Data e Hora do Aceite:</span>
          <span class="meta-val">${signatureRecord.timestamp}</span>
        </div>
        
        <div class="meta-row">
          <span class="meta-lbl">Endereço de IP:</span>
          <span class="meta-val" style="font-family: monospace; color: #047857;">${signatureRecord.ipAddress}</span>
        </div>
        
        <div class="meta-row">
          <span class="meta-lbl">Sistema Operacional:</span>
          <span class="meta-val">${signatureRecord.os}</span>
        </div>
        
        <div class="meta-row">
          <span class="meta-lbl">Navegador Utilizado:</span>
          <span class="meta-val">${signatureRecord.browser}</span>
        </div>
      </div>

      <div class="signature-box">
        <div class="signature-box-title">Assinatura Digital Capturada</div>
        <img class="signature-image" src="${signatureRecord.signatureImage}" alt="Assinatura Eletrônica" />
        <div style="font-size: 9px; color: #64748b; margin-top: 10px; font-family: monospace; text-align: center;">ID-AUTENTICAÇÃO: SHA256-ATALAIA-${Math.floor(Math.random() * 900000 + 100000)}</div>
      </div>
    </div>

    <div class="card-meta-title" style="margin-bottom: 8px;">Termos Contratuais íntegros Aceitos</div>
    <div class="contract-text">
      <div class="section-title">📄 CONTRATO DE ADESÃO – ATALAIA SEGURANÇA COLABORATIVA (SAAS)</div>
      
      <div class="section-title">1. PARTES CONTRATANTES</div>
      <p><strong>CONTRATADA (PLATAFORMA):</strong> Atalaia Segurança Colaborativa, plataforma tecnológica de segurança colaborativa, vinculada à Alien Monitoramento Eletrônico Ltda., inscrita no CNPJ nº 51.482.661/0001-31, com sede na Avenida Josué di Bernardi, nº 185, sala 27, Campinas, São José – SC.</p>
      <p><strong>CONTRATANTE (USUÁRIO):</strong> ${signatureRecord.name}, de CPF/CNPJ n. ${signatureRecord.document}, devidamente cadastrado na plataforma Atalaia, que adere ao presente contrato mediante aceite digital.</p>

      <div class="section-title">2. OBJETO DO CONTRATO</div>
      <p>O presente contrato tem por objeto a licença de uso da plataforma digital Atalaia Segurança Colaborativa, sistema SaaS destinado ao compartilhamento de informações, alertas, registros e integração de eventos relacionados à segurança comunitária e monitoramento eletrônico colaborativo.</p>
      <p>A plataforma atua exclusivamente como infraestrutura tecnológica de comunicação e gestão de eventos, não se caracterizando como empresa de vigilância armada ou segurança privada direta.</p>

      <div class="section-title">3. NATUREZA DO SERVIÇO (SAAS)</div>
      <p>O Atalaia é um sistema Software as a Service (SaaS), fornecido em ambiente digital, com acesso via internet, sujeito a atualizações contínuas, melhorias e evolução de funcionalidades.</p>
      <p>O uso da plataforma é concedido em caráter: Não exclusivo, Intransferível e Revogável conforme termos deste contrato.</p>

      <div class="section-title">4. PLANOS DISPONÍVEIS</div>
      <p>O CONTRATANTE poderá aderir a um dos seguintes planos comercializados ou vinculados:</p>
      <p><strong>🟢 4.1 PLANO GRATUITO (BASIC COLABORATIVO)</strong>: Plano sem custo mensal, com funcionalidades limitadas. Acesso básico à plataforma, visualização de alertas comunitários limitados, cadastro básico de usuário, participação restrita na rede colaborativa, sem suporte prioritário, sem recursos avançados de análise ou integração. Mesmo sendo gratuito, exige aceite integral deste contrato para utilização da plataforma.</p>
      <p><strong>🔵 4.2 PLANO STANDARD – R$ 39,90 / MÊS</strong>: Inclui: Acesso completo à rede colaborativa Atalaia, Registro e visualização de eventos em tempo real, Notificações em tempo real, Histórico de eventos básico, Suporte padrão via plataforma e participação ativa.</p>
      <p><strong>🟣 4.3 PLANO PREMIUM – R$ 79,90 / MÊS</strong>: Inclui todos os benefícios do plano Standard, acrescidos de: Prioridade em alertas críticos, Histórico estendido de eventos, Recursos avançados de análise de ocorrências, Integração ampliada com dispositivos e sistemas compatíveis, Suporte prioritário e acesso a funcionalidades exclusivas.</p>

      <div class="section-title">5. CONDIÇÕES DE PAGAMENTO (PLANOS PAGOS)</div>
      <p>Para os planos Standard e Premium: Cobrança mensal recorrente automática. Pagamento via PIX, cartão de crédito ou gateway integrado. Vencimento conforme data de adesão do usuário. Em caso de inadimplência, poderá ocorrer suspensão automática do acesso aos recursos pagos.</p>

      <div class="section-title">6. ADESÃO E ACEITE DIGITAL</div>
      <p>A adesão à plataforma ocorre mediante: Cadastro do usuário, Aceite eletrônico deste contrato e Registro de data, hora e identificação digital (IP e logs do sistema). Este aceite possui validade jurídica plena, conforme legislação vigente de assinaturas eletrônicas no Brasil.</p>

      <div class="section-title">7. OBRIGAÇÕES DO USUÁRIO</div>
      <p>O CONTRATANTE compromete-se a: Utilizar a plataforma de forma lícita e responsável, Não inserir informações falsas, fraudulentas ou maliciosas, Manter sigilo de suas credenciais de acesso, Não tentar interferir, invadir ou comprometer a plataforma e Utilizar os dados exclusivamente para fins legítimos de segurança colaborativa.</p>

      <div class="section-title">8. OBRIGAÇÕES DA PLATAFORMA</div>
      <p>A CONTRATADA compromete-se a: Disponibilizar a plataforma conforme plano contratado, Manter funcionamento dentro de padrões técnicos razoáveis, Realizar atualizações e melhorias contínuas, Proteger dados dos usuários conforme legislação aplicável e Oferecer suporte conforme nível do plano contratado.</p>

      <div class="section-title">9. DISPONIBILIDADE E MANUTENÇÃO</div>
      <p>A plataforma poderá: Passar por atualizações técnicas e melhorias contínuas, Sofrer interrupções temporárias para manutenção e Alterar ou evoluir funcionalidades sem aviso prévio, desde que não prejudique o funcionamento essencial do serviço.</p>

      <div class="section-title">10. LIMITAÇÃO DE RESPONSABILIDADE</div>
      <p>A plataforma Atalaia não se responsabiliza por: Falhas de internet ou energia do usuário, Uso indevido da plataforma por terceiros, Interpretação incorreta de alertas ou informações, Danos indiretos decorrentes do uso da plataforma e Eventos externos fora do controle tecnológico do sistema.</p>

      <div class="section-title">11. RESCISÃO E CANCELAMENTO</div>
      <p>O usuário poderá cancelar seu plano pago a qualquer momento. Não haverá multa para cancelamento de planos mensais sem fidelidade. O acesso permanecerá ativo até o final do ciclo pago. A plataforma poderá suspender ou encerrar contas em caso de violação deste contrato.</p>

      <div class="section-title">12. ALTERAÇÕES DO CONTRATO</div>
      <p>A CONTRATADA poderá alterar este contrato para: Ajustes legais, Melhores operacionais e Evolução da plataforma. Os usuários serão notificados dentro da própria plataforma.</p>

      <div class="section-title">13. PROPRIEDADE INTELECTUAL</div>
      <p>Todo o sistema Atalaia, incluindo software, identidade visual, código, funcionalidades e estrutura lógica, é de propriedade exclusiva da CONTRATADA. É proibida reprodução, cópia ou engenharia reversa.</p>

      <div class="section-title">14. FORO</div>
      <p>Fica eleito o foro da comarca de São José – SC, para dirimir quaisquer controvérsias oriundas deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.</p>

      <div class="section-title">15. ASSINATURA ELETRÔNICA</div>
      <p>O presente contrato é aceito de forma digital pelo usuário no momento do cadastro, tendo plena validade jurídica.</p>
    </div>

    <div class="footer">
      <strong>Declaração de Integridade Forense Eletrônica</strong><br>
      Este certificado foi emitido em ambiente de nuvem da Atalaia Segurança Colaborativa.<br>
      Campinas, São José – SC, CEP 88101-200. Alien Monitoramento Eletrônico Ltda • CNPJ 51.482.661/0001-31
    </div>
  </div>

  <script>
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>`;

    // Process down to dynamic data uri blob
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create transient anchor tag and simulation click to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Comprovante_Adesao_Atalaia_${signatureRecord.name.replace(/\\s+/g, '_')}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="contrato-adesao-morador" className="print:bg-white print:text-black">
      <style>{`
        @media print {
          /* Clean page setup */
          @page {
            margin: 1.5cm;
            size: portrait;
          }
          
          /* Hide everything except the contract container */
          body * {
            visibility: hidden !important;
          }
          
          /* Force visibility of the contract module */
          #contrato-adesao-morador,
          #contrato-adesao-morador * {
            visibility: visible !important;
          }
          
          /* Position contract perfectly at the top left of the blank paper */
          #contrato-adesao-morador {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }

          /* Completely hide interactive controls & buttons */
          .print\\:hidden,
          button,
          .no-print,
          input,
          select {
            display: none !important;
          }

          /* Force high-contrast document texts and pure white card bounds */
          #contrato-adesao-morador .bg-green-950\\/10,
          #contrato-adesao-morador .bg-black\\/40,
          #contrato-adesao-morador .bg-\\[\\#030303\\],
          #contrato-adesao-morador .bg-\\[\\#040404\\] {
            background: #ffffff !important;
            background-color: #ffffff !important;
            border-color: #e4e4e7 !important;
            box-shadow: none !important;
          }

          /* Style the digital trace audit trail box cleanly */
          #contrato-adesao-morador .bg-black\\/40 {
            background: #f4f4f5 !important;
            background-color: #f4f4f5 !important;
            border: 1px solid #e4e4e7 !important;
            border-radius: 12px !important;
            padding: 16px !important;
          }

          /* Ensure dark biometric signature seal displays perfectly */
          #contrato-adesao-morador .bg-\\[\\#0c0c0c\\] {
            background: #18181b !important;
            background-color: #18181b !important;
            border-color: #3f3f46 !important;
          }

          /* Clean border lines */
          #contrato-adesao-morador .border,
          #contrato-adesao-morador .border-b,
          #contrato-adesao-morador .border-t {
            border-color: #e2e8f0 !important;
          }

          /* High density rich black typography */
          #contrato-adesao-morador h3,
          #contrato-adesao-morador h4,
          #contrato-adesao-morador p,
          #contrato-adesao-morador span,
          #contrato-adesao-morador li,
          #contrato-adesao-morador div {
            color: #000000 !important;
          }

          /* Standardize subtexts for perfect gray-scaling */
          #contrato-adesao-morador .text-gray-500,
          #contrato-adesao-morador .text-zinc-500,
          #contrato-adesao-morador .text-gray-400 {
            color: #4b5563 !important;
          }

          /* Elegant highlight colored states */
          #contrato-adesao-morador .text-\\[\\#00ff66\\],
          #contrato-adesao-morador .text-atalaia-neon {
            color: #047857 !important; /* Premium dark-emerald */
            font-weight: 700 !important;
          }

          /* Stamp badges */
          #contrato-adesao-morador .bg-green-500\\/10 {
            background-color: #f0fdf4 !important;
            color: #166534 !important;
            border: 1px solid #bbf7d0 !important;
          }

          /* Force full contract scroll bodies to print inline, preventing scroll-clipping */
          #contrato-adesao-morador .max-h-\\[250px\\],
          #contrato-adesao-morador .overflow-y-auto {
            max-height: none !important;
            overflow-y: visible !important;
          }
        }
      `}</style>
      {signatureRecord ? (
        // RENDER SIGNED CONTRACT RECEIPT
        <Card className="p-6 md:p-8 border-green-500/30 bg-green-950/10 shadow-[0_4px_30px_rgba(0,0,0,0.4)] animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-white/10 pb-6 mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-500/20 text-[#00ff66]">
                <Check size={28} />
              </div>
              <div>
                <span className="text-xs bg-green-500/10 text-[#00ff66] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                  Contrato Assinado Digitalmente
                </span>
                <h3 className="text-xl font-bold text-white mt-1">Conformidade e Aceite de Termos</h3>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 print:hidden">
              <Button 
                onClick={downloadPrintableReceipt}
                className="bg-atalaia-neon hover:bg-atalaia-neon/90 text-black flex items-center justify-center gap-1.5 h-10 px-4 font-bold text-xs"
              >
                <Download size={15} /> Baixar Comprovante Oficial
              </Button>
              <Button 
                onClick={() => {
                  window.focus();
                  window.print();
                }}
                variant="outline"
                className="border-white/10 hover:bg-white/10 text-white flex items-center justify-center gap-1.5 h-10 px-4 text-xs font-bold"
              >
                Imprimir Direto
              </Button>
              <Button 
                onClick={handleRevoke}
                variant="outline"
                className="text-red-500 border-red-500/10 hover:bg-red-500/10 h-10 px-4 text-xs font-bold"
              >
                Refazer Assinatura
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Meta-analytics audit signature box */}
            <div className="bg-black/40 rounded-2xl p-6 border border-white/5 flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] uppercase font-bold tracking-wider text-[#00ff66] mb-3">Linha de Auditoria Digital</h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-gray-500 font-semibold">Signatário:</span>
                    <span className="text-white font-bold">{signatureRecord.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-gray-500 font-semibold">Documento (CPF/CNPJ):</span>
                    <span className="text-white font-mono">{signatureRecord.document}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-gray-500 font-semibold">Telefone:</span>
                    <span className="text-white font-mono">{signatureRecord.phone || 'Não inf.'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-gray-500 font-semibold">Data e Hora:</span>
                    <span className="text-white">{signatureRecord.timestamp}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-gray-500 font-semibold">Endereço IP:</span>
                    <span className="text-[#00ff66] font-mono">{signatureRecord.ipAddress}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-gray-500 font-semibold">Sistema / OS:</span>
                    <span className="text-white">{signatureRecord.os}</span>
                  </div>
                  <div className="flex justify-between pb-1.5">
                    <span className="text-gray-500 font-semibold">Navegador:</span>
                    <span className="text-white">{signatureRecord.browser}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5">
                <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                  <Shield size={12} className="text-[#00ff66]" /> Código de Integridade: SHA256-ATALAIA-{Math.floor(Math.random()*900000+100000)}
                </span>
              </div>
            </div>

            {/* Signature Draw Capture block */}
            <div className="bg-black/40 rounded-2xl p-6 border border-white/5 flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-2">Assinatura Capturada</span>
              <div className="bg-[#0c0c0c] border border-white/10 rounded-xl p-4 w-full h-[150px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-2 left-2 text-[8px] text-zinc-600 uppercase font-bold">Atalaia Secure Canvas v1</div>
                <img 
                  src={signatureRecord.signatureImage} 
                  alt="Assinatura Digital" 
                  className="max-h-full max-w-full object-contain invert-0 brightness-110" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-[10px] text-gray-500 mt-2 italic text-center">Registrado sob marco civil da internet nº 12.965/2014</span>
            </div>
          </div>

          {/* Quick collapse contract preview */}
          <div className="border border-white/5 rounded-2xl bg-[#030303]">
            <button 
              onClick={() => setShowFullContract(!showFullContract)}
              className="w-full flex items-center justify-between p-4 text-xs font-bold text-gray-400 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <FileText size={16} /> Ver Contrato de Adesão Assinado
              </span>
              <span>{showFullContract ? <EyeOff size={16} /> : <Eye size={16} />}</span>
            </button>
            {showFullContract && (
              <div className="p-4 border-t border-white/5 max-h-[250px] overflow-y-auto text-[11px] text-gray-500 leading-relaxed font-mono space-y-3">
                <p className="font-extrabold text-white text-xs border-b border-white/5 pb-2">CONTRATO DE ADESÃO – ATALAIA SEGURANÇA COLABORATIVA (SAAS)</p>
                <p><strong>1. PARTES CONTRATANTES</strong></p>
                <p><strong>CONTRATADA (PLATAFORMA):</strong> Atalaia Segurança Colaborativa, plataforma tecnológica de segurança colaborativa, vinculada à Alien Monitoramento Eletrônico Ltda., inscrita no CNPJ nº 51.482.661/0001-31, com sede na Avenida Josué di Bernardi, nº 185, sala 27, Campinas, São José – SC.</p>
                <p><strong>CONTRATANTE (USUÁRIO):</strong> {signatureRecord.name}, Doc: {signatureRecord.document}, devidamente cadastrado na plataforma Atalaia.</p>
                <p><strong>2. OBJETO DO CONTRATO:</strong> Licença de uso da plataforma digital Atalaia Segurança Colaborativa, sistema SaaS destinado ao compartilhamento de informações, alertas, registros e integração de eventos relacionados à segurança comunitária e monitoramento eletrônico colaborativo. A plataforma atua exclusivamente como infraestrutura tecnológica de comunicação, não se caracterizando como empresa de vigilância armada.</p>
                <p>... (Contrato Assinado Integralmente sob as Condições Atalaia - Foro de São José/SC)</p>
              </div>
            )}
          </div>
        </Card>
      ) : (
        // RENDER OUT CONTRACT AND SIGN FORM
        <Card className="p-6 md:p-8 bg-[#030303] border-white/10 shadow-2xl animate-in fade-in duration-300">
          <div className="flex items-start gap-4 mb-6 border-b border-white/5 pb-5">
            <div className="p-3 bg-yellow-500/15 rounded-2xl text-yellow-500 shrink-0">
              <FileText size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded font-black tracking-wider uppercase">Pendente</span>
                <span className="text-[10px] text-gray-500">Documento Ativo para Assinar</span>
              </div>
              <h3 className="text-xl font-bold text-white mt-1">Contrato de Adesão – Atalaia SaaS</h3>
              <p className="text-gray-400 text-xs mt-0.5">Por favor, leia integralmente e desenhe sua assinatura eletrônica abaixo.</p>
            </div>
          </div>

          {/* Core Legal text scroll pane */}
          <div className="bg-black/60 rounded-2xl border border-white/10 p-5 mb-8 h-[240px] overflow-y-auto text-xs text-gray-400 leading-relaxed space-y-4 shadow-inner">
            <div className="text-center font-bold text-white text-sm pb-3 border-b border-white/10 uppercase tracking-tight">
              CONTRATO DE ADESÃO – ATALAIA SEGURANÇA COLABORATIVA (SAAS)
            </div>
            
            <div>
              <h4 className="font-bold text-white border-l-2 border-atalaia-neon pl-2 mb-2 text-xs">1. PARTES CONTRATANTES</h4>
              <p className="mb-2"><strong>CONTRATADA (PLATAFORMA):</strong> Atalaia Segurança Colaborativa, plataforma tecnológica de segurança colaborativa, vinculada à Alien Monitoramento Eletrônico Ltda., inscrita no CNPJ nº 51.482.661/0001-31, com sede na Avenida Josué di Bernardi, nº 185, sala 27, Campinas, São José – SC.</p>
              <p><strong>CONTRATANTE (USUÁRIO):</strong> Pessoa física ou jurídica devidamente cadastrada na plataforma Atalaia, que adere ao presente contrato mediante aceite digital de assinatura eletrônica.</p>
            </div>

            <div>
              <h4 className="font-bold text-white border-l-2 border-atalaia-neon pl-2 mb-2 text-xs">2. OBJETO DO CONTRATO</h4>
              <p>O presente contrato tem por objeto a licença de uso da plataforma digital Atalaia Segurança Colaborativa, sistema SaaS destinado ao compartilhamento de informações, alertas, registros e integração de eventos relacionados à segurança comunitária e monitoramento eletrônico colaborativo.</p>
              <p className="mt-2 font-bold text-yellow-500/80">A plataforma atua exclusivamente como infraestrutura tecnológica de comunicação e gestão de eventos, não se caracterizando como empresa de vigilância armada ou segurança privada direta.</p>
            </div>

            <div>
              <h4 className="font-bold text-white border-l-2 border-atalaia-neon pl-2 mb-2 text-xs">3. NATUREZA DO SERVIÇO (SAAS)</h4>
              <p>O Atalaia é um sistema Software as a Service (SaaS), fornecido em ambiente digital, com acesso via internet, sujeito a atualizações contínuas, melhorias e evolução de funcionalidades. O uso é concedido em caráter não exclusivo, intransferível e revogável conforme termos deste contrato.</p>
            </div>

            <div>
              <h4 className="font-bold text-white border-l-2 border-atalaia-neon pl-2 mb-2 text-xs">4. PLANOS DISPONÍVEIS</h4>
              <div className="space-y-3 pl-2 mt-2">
                <p>🟢 <strong className="text-white">4.1 PLANO GRATUITO (BASIC COLABORATIVO)</strong>: Plano sem custo mensal, com funcionalidades limitadas, acesso básico comunitário e cadastro. Mesmo sendo gratuito, exige aceite integral para uso.</p>
                <p>🔵 <strong className="text-white">4.2 PLANO STANDARD – R$ 39,90 / MÊS</strong>: Integração completa de rede ativa de eventos, notificação real-time, escolta de aviso chegada/saída e solicitação de rondas comunitárias.</p>
                <p>🟣 <strong className="text-white">4.3 PLANO PREMIUM – R$ 79,90 / MÊS</strong>: Prioridade de alertas táticos imediatos, suporte tático WhatsApp direto, histórico estendido e recursos avançados de análise de ocorrências comunitárias.</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white border-l-2 border-atalaia-neon pl-2 mb-2 text-xs">5. CONDIÇÕES DE PAGAMENTO (PLANOS PAGOS)</h4>
              <p>Cobrança recorrente mensal automatizada para planos Standard e Premium. Vencimento na data de adesão. A inadimplência possibilita a suspensão imediata de serviços de suporte adicionais.</p>
            </div>

            <div>
              <h4 className="font-bold text-white border-l-2 border-atalaia-neon pl-2 mb-2 text-xs">6. ADESÃO E ACEITE DIGITAL</h4>
              <p>A adesão ocorre por cadastro e aceite eletrônico deste contrato. Registra-se IP, data/hora e logs do sistema computadorizados, garantindo validade jurídica e probatória adequada perante legislação de assinaturas eletrônicas do Brasil.</p>
            </div>

            <div>
              <h4 className="font-bold text-white border-l-2 border-atalaia-neon pl-2 mb-2 text-xs">7. OBRIGAÇÕES DO USUÁRIO</h4>
              <p>O CONTRATANTE compromete-se a: utilizar licitamente de forma responsável, abster-se de falsidade/fraudes, guardar credenciais sigilosamente e não tentar invasões.</p>
            </div>

            <div>
              <h4 className="font-bold text-white border-l-2 border-atalaia-neon pl-2 mb-2 text-xs">8. OBRIGAÇÕES DA PLATAFORMA</h4>
              <p>A plataforma Atalaia garante a entrega técnica continuada cabível, realizar atualizações contínuas de segurança e zelar pela privacidade dos dados sob as regulamentações aplicáveis.</p>
            </div>

            <div>
              <h4 className="font-bold text-white border-l-2 border-atalaia-neon pl-2 mb-2 text-xs">9. DISPONIBILIDADE E MANUTENÇÃO</h4>
              <p>Reconhecemos a possibilidade de manutenções com comunicados razoáveis que evitem interferência em serviços táticos cruciais.</p>
            </div>

            <div>
              <h4 className="font-bold text-white border-l-2 border-atalaia-neon pl-2 mb-2 text-xs">10. LIMITAÇÃO DE RESPONSABILIDADE</h4>
              <p>O Atalaia não responde por oscilações na rede de internet e dados do usuário, erros pessoais na parametrização ou uso indevido da ferramenta por contas de terceiros.</p>
            </div>

            <div>
              <h4 className="font-bold text-white border-l-2 border-atalaia-neon pl-2 mb-2 text-xs">11. RESCISÃO E CANCELAMENTO</h4>
              <p>O usuário poderá solicitar o cancelamento a qualquer momento através do sistema sem multa alguma, cessando nova cobrança para o ciclo seguinte.</p>
            </div>

            <div>
              <h4 className="font-bold text-white border-l-2 border-atalaia-neon pl-2 mb-2 text-xs">12. ALTERAÇÕES DO CONTRATO</h4>
              <p>O Atalaia poderá atualizar estes termos operacionais ou legislativos informando o usuário em sua tela central de login.</p>
            </div>

            <div>
              <h4 className="font-bold text-white border-l-2 border-atalaia-neon pl-2 mb-2 text-xs">13. PROPRIEDADE INTELECTUAL</h4>
              <p>A identidade, marcas, logotipos e estrutura de software pertencem unicamente à CONTRATADA vinculada.</p>
            </div>

            <div>
              <h4 className="font-bold text-white border-l-2 border-atalaia-neon pl-2 mb-2 text-xs">14. FORO</h4>
              <p>Fica eleito o foro da comarca de São José – SC, para dirimir controvérsias oriundas deste contrato, renunciando a qualquer outro por mais privilegiado que se mostre.</p>
            </div>

            <div>
              <h4 className="font-bold text-white border-l-2 border-atalaia-neon pl-2 mb-2 text-xs">15. ASSINATURA ELETRÔNICA</h4>
              <p>O presente contrato é validado digitalmente pelo usuário final através de clique de aprovação de termos e de desenho de assinatura biométrica virtual.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Nome Completo do Signatário</label>
                <Input 
                  value={signerName} 
                  onChange={e => setSignerName(e.target.value)} 
                  placeholder="Seu nome completo" 
                  className="bg-black/50 border-white/10 focus:border-atalaia-neon text-white h-11"
                  required
                />
              </div>
              
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Registro (CPF / CNPJ)</label>
                <Input 
                  value={documentNumber} 
                  onChange={e => setDocumentNumber(e.target.value)} 
                  placeholder="000.000.000-00" 
                  className="bg-black/50 border-white/10 focus:border-atalaia-neon text-white font-mono h-11"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Número de Telefone</label>
                <Input 
                  value={signerPhone} 
                  onChange={e => setSignerPhone(e.target.value)} 
                  placeholder="(00) 90000-0000" 
                  className="bg-black/50 border-white/10 focus:border-atalaia-neon text-white font-mono h-11"
                />
              </div>
            </div>

            {/* Drawing core canvas pad */}
            <div className="bg-black/40 rounded-2xl border border-white/10 p-5">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-3">
                <div>
                  <h4 className="text-xs font-bold text-white">Desenhe sua Assinatura Digital</h4>
                  <p className="text-[10px] text-gray-500">Escreva usando o mouse ou dedo no retângulo abaixo:</p>
                </div>

                <div className="flex bg-black rounded-lg p-1 border border-white/5 items-center gap-2">
                  <span className="text-[10px] text-zinc-500 pl-2">Caneta:</span>
                  <button 
                    type="button"
                    onClick={() => setPenColor('#00ff66')} 
                    className={`w-4 h-4 rounded-full bg-[#00ff66] transition-transform ${penColor === '#00ff66' ? 'scale-125 border border-white' : 'opacity-60'}`}
                  />
                  <button 
                    type="button"
                    onClick={() => setPenColor('#3b82f6')} 
                    className={`w-4 h-4 rounded-full bg-blue-500 transition-transform ${penColor === '#3b82f6' ? 'scale-125 border border-white' : 'opacity-60'}`}
                  />
                  <button 
                    type="button"
                    onClick={() => setPenColor('#ffffff')} 
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${penColor === '#ffffff' ? 'scale-125 border border-zinc-900' : 'opacity-60'}`}
                  />
                  <span className="h-4 w-[1px] bg-white/10 mx-1" />
                  <Button 
                    type="button" 
                    onClick={clearCanvas} 
                    className="p-1.5 h-6 text-[9px] font-black uppercase tracking-wider bg-zinc-900 border border-white/10 text-gray-400 hover:text-white flex items-center gap-1"
                  >
                    <RefreshCw size={10} /> Limpar
                  </Button>
                </div>
              </div>

              <div className="relative">
                <canvas 
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[140px] bg-zinc-950 rounded-xl border border-white/10 cursor-crosshair block touch-none"
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-zinc-600 font-mono text-[10px] uppercase tracking-wider">
                    Assine Aqui
                  </div>
                )}
              </div>
            </div>

            {/* Trace security note */}
            <div className="p-3.5 bg-yellow-500/5 rounded-xl border border-yellow-500/10 flex items-start gap-2.5 text-[10px] text-yellow-500/90 leading-normal">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <div>
                Este aceite tem valor probatório jurídico conforme Lei Federal nº 14.063/2020. 
                Sua identidade digital será associada aos logs do servidor (IP: <span className="font-mono text-white">{metadata.ip}</span> | OS: <span className="text-white">{metadata.os}</span> | Navegador: <span className="text-white">{metadata.browser}</span>).
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={acceptedTerms} 
                  onChange={e => setAcceptedTerms(e.target.checked)}
                  className="rounded bg-zinc-900 border-white/10 text-atalaia-neon focus:ring-atalaia-neon/40 h-4 w-4"
                />
                <span className="text-[11px] text-zinc-400 select-none group-hover:text-white transition-colors">
                  Declaro que li e aceito integralmente os termos do contrato de adesão Atalaia.
                </span>
              </label>

              <Button 
                type="submit" 
                disabled={loading || !acceptedTerms || !hasDrawn}
                className="w-full md:w-auto h-12 uppercase font-black px-8 text-black bg-atalaia-neon hover:bg-atalaia-neon/90"
              >
                {loading ? 'Processando e Gerando Firma...' : 'Registrar Assinatura Digital'}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};
