import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ShieldCheck, 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Search, 
  ChevronRight, 
  FileText, 
  Printer, 
  Copy, 
  Check, 
  ArrowUp, 
  Sliders, 
  BookOpen, 
  Eye, 
  Lock, 
  AlertTriangle, 
  Download, 
  Scale, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const POLICY_SECTIONS = [
  {
    id: 'intro',
    number: '',
    title: 'POLÍTICA DE SOLICITAÇÃO, RECUPERAÇÃO E FORNECIMENTO DE IMAGENS',
    subtitle: 'ALIEN SISTEMAS DE SEGURANÇA ELETRÔNICA',
    content: [
      'Documento Oficial de Diretrizes de Segurança, Privacidade e Conformidade com a LGPD (Lei nº 13.709/2018) para Sistemas de Videomonitoramento Eletrônico sob Operação ou Armazenamento da ALIEN.'
    ]
  },
  {
    id: 'sec-1',
    number: '1',
    title: 'OBJETIVO',
    content: [
      'Esta política estabelece os procedimentos adotados pela ALIEN SISTEMAS DE SEGURANÇA ELETRÔNICA para recebimento, análise, recuperação, preservação e eventual fornecimento de imagens provenientes dos sistemas de videomonitoramento sob sua operação ou armazenamento.',
      'A política tem como objetivo proteger a privacidade das pessoas filmadas, os interesses dos clientes contratantes, a segurança das informações e os direitos previstos na legislação aplicável, especialmente a Lei Geral de Proteção de Dados Pessoais – LGPD (Lei nº 13.709/2018).'
    ]
  },
  {
    id: 'sec-2',
    number: '2',
    title: 'QUEM PODE SOLICITAR IMAGENS',
    content: [
      'As solicitações poderão ser realizadas por:',
      'a) cliente contratante do serviço;',
      'b) pessoa que seja titular dos dados pessoais registrados nas imagens;',
      'c) representante legal devidamente autorizado;',
      'd) autoridade policial ou outra autoridade pública competente;',
      'e) autoridade judicial;',
      'f) terceiro que demonstre motivo legítimo para a solicitação, sujeito à análise da ALIEN e/ou do responsável pelo sistema de videomonitoramento.',
      'A simples alegação de que uma pessoa aparece em determinada câmera não autoriza automaticamente o fornecimento do arquivo integral da gravação, especialmente quando houver imagens de outras pessoas.'
    ]
  },
  {
    id: 'sec-3',
    number: '3',
    title: 'QUANDO A ALIEN PODERÁ FORNECER AS IMAGENS',
    content: [
      'As imagens poderão ser fornecidas quando houver fundamento legítimo para o acesso e quando o fornecimento não representar violação aos direitos de terceiros.',
      'Sempre que possível, o fornecimento deverá limitar-se ao período, câmera e evento estritamente necessários para atender à finalidade da solicitação.',
      'Quando a gravação contiver terceiros identificáveis, a ALIEN poderá:',
      '• limitar o trecho fornecido;',
      '• utilizar recursos técnicos para ocultação/anonimização de terceiros, quando tecnicamente viável;',
      '• solicitar autorização do responsável pelo sistema;',
      '• encaminhar o solicitante ao controlador responsável pelas imagens;',
      '• ou exigir solicitação de autoridade competente, conforme o caso.'
    ]
  },
  {
    id: 'sec-4',
    number: '4',
    title: 'SOLICITAÇÕES FEITAS PELO PRÓPRIO TITULAR',
    content: [
      'Quando uma pessoa solicitar acesso a imagens nas quais ela própria esteja identificável, a solicitação deverá ser analisada como possível exercício de direito do titular de dados pessoais.',
      'Nessa situação, a ALIEN deverá verificar:',
      '• a identidade do solicitante;',
      '• a existência das imagens;',
      '• o período solicitado;',
      '• a câmera envolvida;',
      '• se a ALIEN é efetivamente o agente responsável pelo atendimento daquela solicitação ou se atua somente como operadora em nome do cliente;',
      '• a existência de terceiros identificáveis nas imagens.',
      'O exercício regular dos direitos do titular não deverá ser condicionado ao pagamento de uma taxa simplesmente pelo fato de o titular estar solicitando acesso aos seus dados pessoais.',
      'A LGPD estabelece que os direitos do titular são exercidos perante o controlador e que o atendimento desses requerimentos não deve gerar custos ao titular.'
    ]
  },
  {
    id: 'sec-5',
    number: '5',
    title: 'QUANDO A SOLICITAÇÃO DEVERÁ SER ENCAMINHADA AO CLIENTE/CONTROLADOR',
    content: [
      'Quando a ALIEN atuar como prestadora de serviço, operadora ou responsável técnico pelo armazenamento das imagens em nome de um cliente, a solicitação poderá ser encaminhada ao cliente responsável pelo sistema.',
      'Nessas situações, a ALIEN deverá evitar disponibilizar diretamente a terceiros imagens cuja decisão de fornecimento pertença ao controlador.',
      'O controlador é o agente responsável pelas principais decisões referentes ao tratamento dos dados pessoais, enquanto o operador atua em nome do controlador e conforme suas instruções.'
    ]
  },
  {
    id: 'sec-6',
    number: '6',
    title: 'QUANDO EXIGIR BOLETIM DE OCORRÊNCIA OU AUTORIDADE POLICIAL',
    content: [
      'A ALIEN poderá orientar o solicitante a registrar Boletim de Ocorrência e solicitar as imagens por meio da autoridade policial quando:',
      'a) houver alegação de furto, roubo, acidente, agressão ou outro crime;',
      'b) a pessoa solicitar imagens envolvendo terceiros;',
      'c) o solicitante não demonstrar relação suficiente com as imagens;',
      'd) houver risco de exposição da privacidade de terceiros;',
      'e) a solicitação envolver investigação criminal;',
      'f) houver dúvida razoável quanto à legitimidade do pedido;',
      'g) a entrega direta puder comprometer investigação, segurança ou direitos de outras pessoas.',
      'Nessas situações, a ALIEN poderá preservar as imagens existentes, dentro das possibilidades técnicas e do período de retenção contratado, para eventual solicitação formal da autoridade competente.',
      'IMPORTANTE: A exigência de Boletim de Ocorrência não deve ser aplicada automaticamente a todo e qualquer pedido de acesso do próprio titular aos seus dados. Ela deve ser utilizada principalmente quando houver necessidade de comprovação do fato, proteção de terceiros ou necessidade de atuação de autoridade competente.'
    ]
  },
  {
    id: 'sec-7',
    number: '7',
    title: 'SOLICITAÇÕES DE TERCEIROS',
    content: [
      'Pessoa que não seja cliente da ALIEN e que não demonstre ser titular dos dados ou representante autorizado não terá direito automático ao recebimento de gravações.',
      'Exemplos frequentes:',
      '• "Quero o vídeo porque meu carro passou nessa rua."',
      '• "Quero ver quem estava na frente do estabelecimento."',
      '• "Quero a gravação porque aconteceu alguma coisa perto da câmera."',
      'Nesses casos, a ALIEN deverá avaliar a solicitação e poderá:',
      '• solicitar informações adicionais;',
      '• encaminhar o solicitante ao responsável pelo local;',
      '• solicitar que seja realizado Boletim de Ocorrência;',
      '• orientar que a autoridade policial solicite oficialmente as imagens;',
      '• ou negar o fornecimento quando não houver fundamento suficiente.'
    ]
  },
  {
    id: 'sec-8',
    number: '8',
    title: 'QUANDO A ALIEN PODERÁ NEGAR O FORNECIMENTO',
    content: [
      'A solicitação poderá ser negada quando:',
      'a) não houver imagens disponíveis;',
      'b) o período solicitado estiver fora do prazo de retenção;',
      'c) a ALIEN não for responsável pelo tratamento ou armazenamento daquela gravação;',
      'd) o solicitante não demonstrar legitimidade suficiente;',
      'e) o fornecimento puder expor indevidamente dados pessoais de terceiros;',
      'f) a solicitação for excessivamente ampla ou incompatível com a finalidade apresentada;',
      'g) houver risco à segurança de pessoas, instalações ou informações;',
      'h) existir determinação contratual ou legal que impeça o fornecimento;',
      'i) a gravação envolver investigação ou procedimento que exija solicitação por autoridade competente;',
      'j) houver impossibilidade técnica de recuperação da gravação.',
      'Quando a ALIEN não for o controlador responsável pela decisão, deverá, sempre que possível, informar ao solicitante quem é o responsável pelo tratamento ou encaminhá-lo ao cliente contratante. A ANPD orienta que, quando o agente que recebe o pedido não for o responsável, ele pode informar que não é o agente de tratamento e indicar, quando possível, o agente responsável.'
    ]
  },
  {
    id: 'sec-9',
    number: '9',
    title: 'COBRANÇA POR SERVIÇO TÉCNICO',
    content: [
      'A ALIEN não cobrará simplesmente pelo exercício de um direito do titular sobre seus próprios dados pessoais.',
      'Entretanto, poderão existir serviços técnicos extraordinários, especialmente quando solicitados por clientes ou terceiros legitimados, que não correspondam simplesmente ao exercício gratuito de direito de acesso.',
      'Poderão ser cobrados, conforme tabela comercial vigente:',
      '• recuperação técnica extraordinária de arquivos;',
      '• recuperação de imagens fora do armazenamento operacional;',
      '• processamento ou conversão de grandes volumes de gravações;',
      '• exportação de grandes períodos;',
      '• preparação de mídias físicas;',
      '• armazenamento adicional solicitado pelo interessado;',
      '• cópias adicionais solicitadas após o primeiro fornecimento;',
      '• serviços técnicos extraordinários que excedam o procedimento normal de atendimento.',
      'A cobrança deverá corresponder ao serviço efetivamente prestado e não deverá ser utilizada como condição para impedir o exercício de direito legal do titular.'
    ]
  },
  {
    id: 'sec-10',
    number: '10',
    title: 'PRESERVAÇÃO DE IMAGENS',
    content: [
      'Quando houver solicitação relacionada a possível crime, acidente, processo judicial ou outro evento relevante, a ALIEN poderá, dentro das possibilidades técnicas e do período de retenção contratado, realizar a preservação temporária das imagens até que o responsável ou autoridade competente possa solicitar formalmente o material.',
      'A preservação não garante a disponibilidade indefinida das gravações e estará sujeita à capacidade de armazenamento, políticas de retenção e condições técnicas do sistema.'
    ]
  },
  {
    id: 'sec-11',
    number: '11',
    title: 'IDENTIFICAÇÃO DO SOLICITANTE',
    content: [
      'Antes do fornecimento de imagens, a ALIEN poderá solicitar informações suficientes para confirmar a legitimidade do pedido.',
      'A comprovação deverá ser proporcional à situação e não deverá exigir informações pessoais desnecessárias.',
      'Para solicitações realizadas por autoridade pública, deverão ser observados os procedimentos e documentos oficiais apresentados pela autoridade competente.'
    ]
  },
  {
    id: 'sec-12',
    number: '12',
    title: 'REGISTRO DAS SOLICITAÇÕES',
    content: [
      'As solicitações de imagens poderão ser registradas pela ALIEN contendo, sempre que possível:',
      '• data e horário da solicitação;',
      '• identificação do solicitante;',
      '• motivo informado;',
      '• cliente/local relacionado;',
      '• câmera solicitada;',
      '• período solicitado;',
      '• decisão tomada;',
      '• responsável pelo atendimento;',
      '• data do fornecimento ou negativa;',
      '• identificação do destinatário;',
      '• observações relevantes.',
      'Esse registro tem como objetivo permitir rastreabilidade e demonstrar os procedimentos adotados pela empresa.'
    ]
  },
  {
    id: 'sec-13',
    number: '13',
    title: 'FORNECIMENTO A AUTORIDADES',
    content: [
      'Quando houver solicitação oficial de autoridade policial, judicial ou outra autoridade competente, a ALIEN deverá analisar a requisição e, estando presentes os requisitos aplicáveis, fornecer as imagens solicitadas de acordo com o procedimento oficial.',
      'Sempre que possível, deverá ser mantido registro do fornecimento, incluindo: autoridade solicitante, órgão, número do procedimento (quando existente), data da solicitação, período das imagens, câmeras envolvidas e forma de entrega.'
    ]
  },
  {
    id: 'sec-14',
    number: '14',
    title: 'PRINCÍPIO DA NECESSIDADE',
    content: [
      'A ALIEN deverá buscar fornecer somente as imagens necessárias para a finalidade legítima apresentada.',
      'Quando for tecnicamente possível, deverão ser evitados fornecimentos excessivos de gravações que contenham informações de terceiros sem necessidade.',
      'A LGPD estabelece, entre seus princípios, que o tratamento deve se limitar ao mínimo necessário para alcançar sua finalidade.'
    ]
  },
  {
    id: 'sec-15',
    number: '15',
    title: 'RESPONSABILIDADE DO SOLICITANTE',
    content: [
      'O recebimento de imagens pelo solicitante não autoriza automaticamente sua divulgação pública, publicação em redes sociais, utilização comercial ou compartilhamento com terceiros.',
      'O solicitante será responsável pela utilização posterior das imagens dentro dos limites da legislação aplicável.'
    ]
  },
  {
    id: 'sec-16',
    number: '16',
    title: 'CASOS NÃO PREVISTOS',
    content: [
      'Situações não previstas nesta política serão analisadas individualmente pela ALIEN SISTEMAS DE SEGURANÇA ELETRÔNICA, considerando:',
      '• legislação aplicável;',
      '• LGPD (Lei 13.709/2018);',
      '• contrato firmado com o cliente;',
      '• finalidade da solicitação;',
      '• direitos do titular;',
      '• privacidade de terceiros;',
      '• segurança das informações;',
      '• orientação do controlador responsável;',
      '• eventual determinação de autoridade competente.'
    ]
  },
  {
    id: 'sec-17',
    number: '17',
    title: 'FLUXO OPERACIONAL DA ALIEN',
    isFlowchart: true,
    content: [
      'Etapas sequenciais de tomada de decisão para análise de solicitações de imagens:',
      '1. SOLICITAÇÃO RECEBIDA',
      '2. QUEM ESTÁ PEDINDO?',
      '   • Cliente → analisar normalmente',
      '   • Pessoa que aparece na imagem → tratar como possível solicitação de titular',
      '   • Terceiro → analisar legitimidade',
      '   • Polícia / autoridade → analisar requisição oficial',
      '3. A ALIEN É RESPONSÁVEL PELA DECISÃO SOBRE OS DADOS?',
      '   • SIM → analisar e responder',
      '   • NÃO → encaminhar ao controlador / cliente responsável',
      '4. EXISTEM TERCEIROS NAS IMAGENS?',
      '   • NÃO → possibilidade de fornecimento, conforme legitimidade',
      '   • SIM → avaliar privacidade e possibilidade de limitar / anonimizar',
      '5. É CASO DE CRIME, ACIDENTE OU INVESTIGAÇÃO?',
      '   • SIM → orientar BO e/ou solicitação oficial da autoridade competente',
      '6. EXISTE SERVIÇO TÉCNICO EXTRAORDINÁRIO?',
      '   • SIM → informar previamente eventual valor comercial, sem impedir o exercício gratuito de direito de titular',
      '7. REGISTRAR A SOLICITAÇÃO',
      '   • Manter registro detalhado da solicitação, decisão e eventual fornecimento.'
    ]
  },
  {
    id: 'sec-18',
    number: '18',
    title: 'REGRA RESUMIDA PARA ATENDIMENTO',
    isHighlight: true,
    content: [
      'A orientação padrão da equipe deverá ser:',
      '“As imagens do sistema de videomonitoramento são tratadas de acordo com a legislação de proteção de dados e com as regras estabelecidas com o responsável pelo sistema. Para proteger a privacidade das pessoas que possam aparecer nas gravações, o fornecimento depende da análise da solicitação e da legitimidade do solicitante. Em casos relacionados a crimes, acidentes ou investigações, poderá ser necessário apresentar Boletim de Ocorrência ou solicitar que a autoridade competente requisite formalmente as imagens.”',
      'Esta política deverá ser aplicada em conjunto com os contratos firmados com os clientes e poderá ser revisada sempre que houver alteração legislativa, regulamentar, contratual ou operacional.'
    ]
  }
];

export const RAW_POLICY_TEXT = `# POLÍTICA DE SOLICITAÇÃO, RECUPERAÇÃO E FORNECIMENTO DE IMAGENS
## ALIEN SISTEMAS DE SEGURANÇA ELETRÔNICA

### 1. OBJETIVO
Esta política estabelece os procedimentos adotados pela ALIEN SISTEMAS DE SEGURANÇA ELETRÔNICA para recebimento, análise, recuperação, preservação e eventual fornecimento de imagens provenientes dos sistemas de videomonitoramento sob sua operação ou armazenamento.
A política tem como objetivo proteger a privacidade das pessoas filmadas, os interesses dos clientes contratantes, a segurança das informações e os direitos previstos na legislação aplicável, especialmente a Lei Geral de Proteção de Dados Pessoais – LGPD (Lei nº 13.709/2018).

---
## 2. QUEM PODE SOLICITAR IMAGENS
As solicitações poderão ser realizadas por:
a) cliente contratante do serviço;
b) pessoa que seja titular dos dados pessoais registrados nas imagens;
c) representante legal devidamente autorizado;
d) autoridade policial ou outra autoridade pública competente;
e) autoridade judicial;
f) terceiro que demonstre motivo legítimo para a solicitação, sujeito à análise da ALIEN e/ou do responsável pelo sistema de videomonitoramento.

A simples alegação de que uma pessoa aparece em determinada câmera não autoriza automaticamente o fornecimento do arquivo integral da gravação, especialmente quando houver imagens de outras pessoas.

---
# 3. QUANDO A ALIEN PODERÁ FORNECER AS IMAGENS
As imagens poderão ser fornecidas quando houver fundamento legítimo para o acesso e quando o fornecimento não representar violação aos direitos de terceiros.
Sempre que possível, o fornecimento deverá limitar-se ao período, câmera e evento estritamente necessários para atender à finalidade da solicitação.

Quando a gravação contiver terceiros identificáveis, a ALIEN poderá:
* limitar o trecho fornecido;
* utilizar recursos técnicos para ocultação/anonimização de terceiros, quando tecnicamente viável;
* solicitar autorização do responsável pelo sistema;
* encaminhar o solicitante ao controlador responsável pelas imagens;
* ou exigir solicitação de autoridade competente, conforme o caso.

---
# 4. SOLICITAÇÕES FEITAS PELO PRÓPRIO TITULAR
Quando uma pessoa solicitar acesso a imagens nas quais ela própria esteja identificável, a solicitação deverá ser analisada como possível exercício de direito do titular de dados pessoais.
Nessa situação, a ALIEN deverá verificar:
* a identidade do solicitante;
* a existência das imagens;
* o período solicitado;
* a câmera envolvida;
* se a ALIEN é efetivamente o agente responsável pelo atendimento daquela solicitação ou se atua somente como operadora em nome do cliente;
* a existência de terceiros identificáveis nas imagens.

O exercício regular dos direitos do titular não deverá ser condicionado ao pagamento de uma taxa simplesmente pelo fato de o titular estar solicitando acesso aos seus dados pessoais.
A LGPD estabelece que os direitos do titular são exercidos perante o controlador e que o atendimento desses requerimentos não deve gerar custos ao titular.

---
# 5. QUANDO A SOLICITAÇÃO DEVERÁ SER ENCAMINHADA AO CLIENTE/CONTROLADOR
Quando a ALIEN atuar como prestadora de serviço, operadora ou responsável técnico pelo armazenamento das imagens em nome de um cliente, a solicitação poderá ser encaminhada ao cliente responsável pelo sistema.
Nessas situações, a ALIEN deverá evitar disponibilizar diretamente a terceiros imagens cuja decisão de fornecimento pertença ao controlador.
O controlador é o agente responsável pelas principais decisões referentes ao tratamento dos dados pessoais, enquanto o operador atua em nome do controlador e conforme suas instruções.

---
# 6. QUANDO EXIGIR BOLETIM DE OCORRÊNCIA OU AUTORIDADE POLICIAL
A ALIEN poderá orientar o solicitante a registrar Boletim de Ocorrência e solicitar as imagens por meio da autoridade policial quando:
a) houver alegação de furto, roubo, acidente, agressão ou outro crime;
b) a pessoa solicitar imagens envolvendo terceiros;
c) o solicitante não demonstrar relação suficiente com as imagens;
d) houver risco de exposição da privacidade de terceiros;
e) a solicitação envolver investigação criminal;
f) houver dúvida razoável quanto à legitimidade do pedido;
g) a entrega direta puder comprometer investigação, segurança ou direitos de outras pessoas.

Nessas situações, a ALIEN poderá preservar as imagens existentes, dentro das possibilidades técnicas e do período de retenção contratado, para eventual solicitação formal da autoridade competente.

### IMPORTANTE
A exigência de Boletim de Ocorrência não deve ser aplicada automaticamente a todo e qualquer pedido de acesso do próprio titular aos seus dados. Ela deve ser utilizada principalmente quando houver necessidade de comprovação do fato, proteção de terceiros ou necessidade de atuação de autoridade competente.

---
# 7. SOLICITAÇÕES DE TERCEIROS
Pessoa que não seja cliente da ALIEN e que não demonstre ser titular dos dados ou representante autorizado não terá direito automático ao recebimento de gravações.
Exemplos:
"Quero o vídeo porque meu carro passou nessa rua."
"Quero ver quem estava na frente do estabelecimento."
"Quero a gravação porque aconteceu alguma coisa perto da câmera."

Nesses casos, a ALIEN deverá avaliar a solicitação e poderá:
* solicitar informações adicionais;
* encaminhar o solicitante ao responsável pelo local;
* solicitar que seja realizado Boletim de Ocorrência;
* orientar que a autoridade policial solicite oficialmente as imagens;
* ou negar o fornecimento quando não houver fundamento suficiente.

---
# 8. QUANDO A ALIEN PODERÁ NEGAR O FORNECIMENTO
A solicitação poderá ser negada quando:
a) não houver imagens disponíveis;
b) o período solicitado estiver fora do prazo de retenção;
c) a ALIEN não for responsável pelo tratamento ou armazenamento daquela gravação;
d) o solicitante não demonstrar legitimidade suficiente;
e) o fornecimento puder expor indevidamente dados pessoais de terceiros;
f) a solicitação for excessivamente ampla ou incompatível com a finalidade apresentada;
g) houver risco à segurança de pessoas, instalações ou informações;
h) existir determinação contratual ou legal que impeça o fornecimento;
i) a gravação envolver investigação ou procedimento que exija solicitação por autoridade competente;
j) houver impossibilidade técnica de recuperação da gravação.

Quando a ALIEN não for o controlador responsável pela decisão, deverá, sempre que possível, informar ao solicitante quem é o responsável pelo tratamento ou encaminhá-lo ao cliente contratante. A ANPD orienta que, quando o agente que recebe o pedido não for o responsável, ele pode informar que não é o agente de tratamento e indicar, quando possível, o agente responsável.

---
# 9. COBRANÇA POR SERVIÇO TÉCNICO
A ALIEN não cobrará simplesmente pelo exercício de um direito do titular sobre seus próprios dados pessoais.
Entretanto, poderão existir serviços técnicos extraordinários, especialmente quando solicitados por clientes ou terceiros legitimados, que não correspondam simplesmente ao exercício gratuito de direito de acesso.

Poderão ser cobrados, conforme tabela comercial vigente:
* recuperação técnica extraordinária de arquivos;
* recuperação de imagens fora do armazenamento operacional;
* processamento ou conversão de grandes volumes de gravações;
* exportação de grandes períodos;
* preparação de mídias físicas;
* armazenamento adicional solicitado pelo interessado;
* cópias adicionais solicitadas após o primeiro fornecimento;
* serviços técnicos extraordinários que excedam o procedimento normal de atendimento.

A cobrança deverá corresponder ao serviço efetivamente prestado e não deverá ser utilizada como condição para impedir o exercício de direito legal do titular.

---
# 10. PRESERVAÇÃO DE IMAGENS
Quando houver solicitação relacionada a possível crime, acidente, processo judicial ou outro evento relevante, a ALIEN poderá, dentro das possibilidades técnicas e do período de retenção contratado, realizar a preservação temporária das imagens até que o responsável ou autoridade competente possa solicitar formalmente o material.
A preservação não garante a disponibilidade indefinida das gravações e estará sujeita à capacidade de armazenamento, políticas de retenção e condições técnicas do sistema.

---
# 11. IDENTIFICAÇÃO DO SOLICITANTE
Antes do fornecimento de imagens, a ALIEN poderá solicitar informações suficientes para confirmar a legitimidade do pedido.
A comprovação deverá ser proporcional à situação e não deverá exigir informações pessoais desnecessárias.
Para solicitações realizadas por autoridade pública, deverão ser observados os procedimentos e documentos oficiais apresentados pela autoridade competente.

---
# 12. REGISTRO DAS SOLICITAÇÕES
As solicitações de imagens poderão ser registradas pela ALIEN contendo, sempre que possível:
* data e horário da solicitação;
* identificação do solicitante;
* motivo informado;
* cliente/local relacionado;
* câmera solicitada;
* período solicitado;
* decisão tomada;
* responsável pelo atendimento;
* data do fornecimento ou negativa;
* identificação do destinatário;
* observações relevantes.
Esse registro tem como objetivo permitir rastreabilidade e demonstrar os procedimentos adotados pela empresa.

---
# 13. FORNECIMENTO A AUTORIDADES
Quando houver solicitação oficial de autoridade policial, judicial ou outra autoridade competente, a ALIEN deverá analisar a requisição e, estando presentes os requisitos aplicáveis, fornecer as imagens solicitadas de acordo com o procedimento oficial.
Sempre que possível, deverá ser mantido registro do fornecimento, incluindo:
* autoridade solicitante;
* órgão;
* número do procedimento, quando existente;
* data da solicitação;
* período das imagens;
* câmeras envolvidas;
* forma de entrega.

---
# 14. PRINCÍPIO DA NECESSIDADE
A ALIEN deverá buscar fornecer somente as imagens necessárias para a finalidade legítima apresentada.
Quando for tecnicamente possível, deverão ser evitados fornecimentos excessivos de gravações que contenham informações de terceiros sem necessidade.
A LGPD estabelece, entre seus princípios, que o tratamento deve se limitar ao mínimo necessário para alcançar sua finalidade.

---
# 15. RESPONSABILIDADE DO SOLICITANTE
O recebimento de imagens pelo solicitante não autoriza automaticamente sua divulgação pública, publicação em redes sociais, utilização comercial ou compartilhamento com terceiros.
O solicitante será responsável pela utilização posterior das imagens dentro dos limites da legislação aplicável.

---
# 16. CASOS NÃO PREVISTOS
Situações não previstas nesta política serão analisadas individualmente pela ALIEN SISTEMAS DE SEGURANÇA ELETRÔNICA, considerando:
* legislação aplicável;
* LGPD;
* contrato firmado com o cliente;
* finalidade da solicitação;
* direitos do titular;
* privacidade de terceiros;
* segurança das informações;
* orientação do controlador responsável;
* eventual determinação de autoridade competente.

---
# 17. FLUXO OPERACIONAL DA ALIEN
SOLICITAÇÃO RECEBIDA
↓
1. Quem está pedindo?
Cliente → analisar normalmente.
Pessoa que aparece na imagem → tratar como possível solicitação de titular.
Terceiro → analisar legitimidade.
Polícia/autoridade → analisar requisição oficial.
↓
2. A ALIEN é responsável pela decisão sobre os dados?
SIM → analisar e responder.
NÃO → encaminhar ao controlador/cliente responsável.
↓
3. Existem terceiros nas imagens?
NÃO → possibilidade de fornecimento, conforme legitimidade.
SIM → avaliar privacidade e possibilidade de limitar/anonimizar.
↓
4. É caso de crime, acidente ou investigação?
SIM → orientar BO e/ou solicitação oficial da autoridade competente, especialmente quando houver terceiros ou risco de divulgação indevida.
↓
5. Existe serviço técnico extraordinário?
SIM → informar previamente eventual valor, desde que a cobrança não seja utilizada para impedir o exercício gratuito de direito legal do titular.
↓
6. Registrar a solicitação
Manter registro da solicitação, decisão e eventual fornecimento.

---
# 18. REGRA RESUMIDA PARA ATENDIMENTO
A orientação padrão da equipe deverá ser:
"As imagens do sistema de videomonitoramento são tratadas de acordo com a legislação de proteção de dados e com as regras estabelecidas com o responsável pelo sistema. Para proteger a privacidade das pessoas que possam aparecer nas gravações, o fornecimento depende da análise da solicitação e da legitimidade do solicitante. Em casos relacionados a crimes, acidentes ou investigações, poderá ser necessário apresentar Boletim de Ocorrência ou solicitar que a autoridade competente requisite formalmente as imagens."

Esta política deverá ser aplicada em conjunto com os contratos firmados com os clientes e poderá ser revisada sempre que houver alteração legislativa, regulamentar, contratual ou operacional.`;

interface ImagePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImagePolicyModal: React.FC<ImagePolicyModalProps> = ({ isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1); // 1 = normal, 0.5 = slow, 1.8 = fast, 2.5 = very fast
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSectionId, setActiveSectionId] = useState<string>('intro');
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showIndex, setShowIndex] = useState(false);
  const [speechActive, setSpeechActive] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollAnimRef = useRef<number | null>(null);

  // Auto-scroll loop with requestAnimationFrame for silky smooth reading
  useEffect(() => {
    let lastTime = performance.now();

    const step = (now: number) => {
      if (!isPlaying || !scrollContainerRef.current) return;
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Base speed: 38 pixels per second at 1x
      const pxToScroll = 40 * speed * delta;
      const el = scrollContainerRef.current;
      
      if (el) {
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 4) {
          setIsPlaying(false);
          return;
        }
        el.scrollTop += pxToScroll;
      }

      scrollAnimRef.current = requestAnimationFrame(step);
    };

    if (isPlaying) {
      lastTime = performance.now();
      scrollAnimRef.current = requestAnimationFrame(step);
    } else {
      if (scrollAnimRef.current) {
        cancelAnimationFrame(scrollAnimRef.current);
      }
    }

    return () => {
      if (scrollAnimRef.current) {
        cancelAnimationFrame(scrollAnimRef.current);
      }
    };
  }, [isPlaying, speed]);

  // Handle scroll progress and active section tracker
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const el = scrollContainerRef.current;
    const total = el.scrollHeight - el.clientHeight;
    const current = el.scrollTop;
    const pct = total > 0 ? Math.min(100, Math.max(0, Math.round((current / total) * 100))) : 0;
    setProgress(pct);

    // Find current active section
    for (const sec of POLICY_SECTIONS) {
      const sectionEl = document.getElementById(`policy-${sec.id}`);
      if (sectionEl) {
        const rect = sectionEl.getBoundingClientRect();
        const containerRect = el.getBoundingClientRect();
        if (rect.top <= containerRect.top + 140 && rect.bottom >= containerRect.top + 20) {
          setActiveSectionId(sec.id);
          break;
        }
      }
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(`policy-${id}`);
    if (el && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const offsetTop = el.offsetTop - 12;
      container.scrollTo({ top: offsetTop, behavior: 'smooth' });
      setActiveSectionId(id);
      setShowIndex(false);
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(RAW_POLICY_TEXT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Política de Fornecimento de Imagens - ALIEN</title>
          <style>
            body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; padding: 40px; color: #111; line-height: 1.6; max-width: 800px; margin: auto; }
            h1 { font-size: 20px; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 4px; text-transform: uppercase; }
            h2 { font-size: 16px; color: #333; margin-top: 0; text-transform: uppercase; }
            h3 { font-size: 14px; margin-top: 24px; border-bottom: 1px solid #ddd; padding-bottom: 4px; color: #004411; }
            p, li { font-size: 13px; color: #222; margin: 6px 0; }
            ul { padding-left: 20px; }
            blockquote { background: #f4f4f4; border-left: 4px solid #008833; margin: 16px 0; padding: 12px 16px; font-style: italic; font-size: 13px; }
            .box { border: 1px solid #ccc; padding: 16px; border-radius: 8px; background: #fafafa; margin: 16px 0; }
            .footer { margin-top: 40px; font-size: 11px; text-align: center; color: #666; border-top: 1px solid #ddd; padding-top: 12px; }
          </style>
        </head>
        <body>
          <h1>POLÍTICA DE SOLICITAÇÃO, RECUPERAÇÃO E FORNECIMENTO DE IMAGENS</h1>
          <h2>ALIEN SISTEMAS DE SEGURANÇA ELETRÔNICA</h2>
          <hr/>
          ${POLICY_SECTIONS.map(s => `
            <div>
              <h3>${s.number ? `${s.number}. ` : ''}${s.title}</h3>
              ${s.subtitle ? `<p><strong>${s.subtitle}</strong></p>` : ''}
              ${s.content.map(p => {
                if (p.startsWith('“') || p.startsWith('"')) {
                  return `<blockquote>${p}</blockquote>`;
                }
                return `<p>${p}</p>`;
              }).join('')}
            </div>
          `).join('')}
          <div class="footer">
            ALIEN MONITORAMENTO ELETRÔNICO LTDA. • CNPJ 51.482.661/0001-31 • SISTEMA ATALAIA
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Text to Speech integration
  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Seu navegador não possui suporte para síntese de voz.');
      return;
    }

    if (speechActive) {
      window.speechSynthesis.cancel();
      setSpeechActive(false);
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(RAW_POLICY_TEXT);
      utterance.lang = 'pt-BR';
      utterance.rate = speed === 0.5 ? 0.8 : speed === 1 ? 1.0 : 1.25;
      
      utterance.onend = () => {
        setSpeechActive(false);
        setIsPlaying(false);
      };
      utterance.onerror = () => {
        setSpeechActive(false);
        setIsPlaying(false);
      };

      window.speechSynthesis.speak(utterance);
      setSpeechActive(true);
      setIsPlaying(true);
    }
  };

  // Stop speech on modal close or unmount
  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setSpeechActive(false);
    }
  }, [isOpen]);

  // Keyboard shortcut: Space toggles auto-scroll, Esc closes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.code === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return POLICY_SECTIONS;
    const q = searchQuery.toLowerCase();
    return POLICY_SECTIONS.filter(sec => 
      sec.title.toLowerCase().includes(q) || 
      sec.number.includes(q) || 
      sec.content.some(p => p.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div 
      id="image-policy-modal-overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200"
    >
      <motion.div 
        id="image-policy-modal-container"
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-5xl bg-[#08080a] border border-atalaia-neon/30 rounded-2xl md:rounded-3xl shadow-[0_0_80px_rgba(0,255,102,0.15)] flex flex-col h-[92vh] max-h-[950px] overflow-hidden text-gray-100"
      >
        {/* Top Progress Bar */}
        <div className="w-full bg-zinc-900 h-1.5 relative overflow-hidden shrink-0">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 via-atalaia-neon to-emerald-400 transition-all duration-150 shadow-[0_0_12px_#00FF66]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-white/10 bg-zinc-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-atalaia-neon/10 border border-atalaia-neon/30 flex items-center justify-center text-atalaia-neon shadow-[0_0_20px_rgba(0,255,102,0.2)] shrink-0">
              <Scale size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-atalaia-neon/15 text-atalaia-neon border border-atalaia-neon/20">
                  LGPD & Videomonitoramento
                </span>
                <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
                  {progress}% lido
                </span>
              </div>
              <h2 className="text-sm sm:text-base md:text-lg font-black text-white uppercase tracking-tight flex items-center gap-1.5 mt-0.5">
                Política de Fornecimento de Imagens
              </h2>
            </div>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              id="btn-policy-index-toggle"
              onClick={() => setShowIndex(!showIndex)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                showIndex 
                  ? 'bg-atalaia-neon text-black border-atalaia-neon' 
                  : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
              }`}
              title="Sumário de Tópicos"
            >
              <Layers size={14} />
              <span className="hidden md:inline">Sumário</span> (18)
            </button>

            <button
              id="btn-policy-copy-text"
              onClick={handleCopyText}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors"
              title="Copiar texto integral"
            >
              {copied ? <Check size={16} className="text-atalaia-neon" /> : <Copy size={16} />}
            </button>

            <button
              id="btn-policy-print"
              onClick={handlePrint}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors"
              title="Imprimir / Salvar em PDF"
            >
              <Printer size={16} />
            </button>

            <button
              id="btn-policy-close"
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/10 text-gray-400 transition-colors ml-1"
              title="Fechar Popup (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Teleprompter / Guided Reading Control Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#0e0e12] border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 select-none">
          {/* Play / Pause Auto-Scroll */}
          <div className="flex items-center gap-2">
            <button
              id="btn-policy-autoscroll-toggle"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-4 py-2 rounded-xl font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg ${
                isPlaying 
                  ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20' 
                  : 'bg-atalaia-neon hover:bg-[#33ff85] text-black shadow-[0_0_20px_rgba(0,255,102,0.3)]'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause size={15} className="fill-black" />
                  <span>Pausar Leitura</span>
                </>
              ) : (
                <>
                  <Play size={15} className="fill-black ml-0.5" />
                  <span>Correr Conforme Leitura</span>
                </>
              )}
            </button>

            <button
              id="btn-policy-scroll-restart"
              onClick={() => {
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors"
              title="Voltar ao início"
            >
              <RotateCcw size={15} />
            </button>

            <button
              id="btn-policy-speech-toggle"
              onClick={toggleSpeech}
              className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 ${
                speechActive 
                  ? 'bg-blue-600 text-white border-blue-400 animate-pulse' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }`}
              title="Ler em voz alta (Síntese de voz)"
            >
              {speechActive ? <Volume2 size={15} /> : <VolumeX size={15} />}
              <span className="text-[10px] font-bold hidden sm:inline">{speechActive ? 'Voz Ativa' : 'Áudio'}</span>
            </button>
          </div>

          {/* Speed & Font Size Adjustments */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Speed Selector */}
            <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-2 py-1">
              <span className="text-[10px] text-zinc-400 uppercase font-mono mr-1">Velocidade:</span>
              {[
                { label: '0.5x', val: 0.5 },
                { label: '1x', val: 1 },
                { label: '1.5x', val: 1.5 },
                { label: '2.5x', val: 2.5 }
              ].map(s => (
                <button
                  key={s.val}
                  onClick={() => setSpeed(s.val)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                    speed === s.val 
                      ? 'bg-atalaia-neon text-black' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Font Size Selector */}
            <div className="hidden sm:flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl px-2 py-1">
              <span className="text-[10px] text-zinc-400 uppercase font-mono mr-1">Texto:</span>
              <button
                onClick={() => setFontSize('sm')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${fontSize === 'sm' ? 'bg-white/20 text-white' : 'text-zinc-500'}`}
              >
                A-
              </button>
              <button
                onClick={() => setFontSize('base')}
                className={`px-1.5 py-0.5 rounded text-xs font-bold ${fontSize === 'base' ? 'bg-white/20 text-white' : 'text-zinc-500'}`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize('lg')}
                className={`px-1.5 py-0.5 rounded text-sm font-bold ${fontSize === 'lg' ? 'bg-white/20 text-white' : 'text-zinc-500'}`}
              >
                A+
              </button>
            </div>
          </div>
        </div>

        {/* Modal Main Content Area */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Interactive Table of Contents Drawer */}
          <AnimatePresence>
            {showIndex && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full bg-zinc-950/95 border-r border-white/10 flex flex-col shrink-0 z-20 overflow-hidden"
              >
                <div className="p-3 border-b border-white/10 flex items-center justify-between bg-black/40">
                  <span className="text-xs font-black text-atalaia-neon uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen size={14} /> Índice dos Tópicos
                  </span>
                  <button 
                    onClick={() => setShowIndex(false)}
                    className="text-zinc-400 hover:text-white p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="p-2 border-b border-white/5">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Pesquisar tópico..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 bg-black/60 border border-white/10 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-atalaia-neon"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {POLICY_SECTIONS.map((sec) => {
                    const isActive = activeSectionId === sec.id;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => scrollToSection(sec.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-start gap-2 ${
                          isActive 
                            ? 'bg-atalaia-neon/15 text-atalaia-neon border border-atalaia-neon/30 font-bold' 
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span className="font-mono text-[10px] text-zinc-500 shrink-0 mt-0.5">
                          {sec.number ? `${sec.number}.` : '•'}
                        </span>
                        <span className="line-clamp-2 leading-tight">
                          {sec.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Document Content Scroll View */}
          <div
            id="policy-scroll-container"
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className={`flex-1 overflow-y-auto p-4 sm:p-8 md:p-12 space-y-10 scroll-smooth relative ${
              fontSize === 'sm' ? 'text-xs' : fontSize === 'lg' ? 'text-base' : 'text-sm'
            }`}
          >
            {/* Teleprompter Active Reading Highlight Bar indicator */}
            {isPlaying && (
              <div className="sticky top-0 z-10 -mx-4 sm:-mx-8 md:-mx-12 px-4 py-1.5 bg-atalaia-neon/10 border-b border-atalaia-neon/20 backdrop-blur-md flex items-center justify-between text-[11px] text-atalaia-neon font-mono animate-pulse">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-atalaia-neon animate-ping" />
                  LEITURA AUTOMÁTICA EM ANDAMENTO • VELOCIDADE {speed}x
                </span>
                <span className="text-[10px] text-zinc-400">Pressione Espaço para pausar</span>
              </div>
            )}

            {filteredSections.map((sec) => {
              const isActive = activeSectionId === sec.id;
              
              if (sec.id === 'intro') {
                return (
                  <div 
                    key={sec.id}
                    id={`policy-${sec.id}`}
                    className="text-center pb-8 border-b border-white/10 space-y-4"
                  >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-atalaia-neon/10 border border-atalaia-neon/30 text-atalaia-neon text-xs font-black uppercase tracking-widest">
                      <ShieldCheck size={14} /> Diretriz Institucional de Privacidade & Imagens
                    </div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight uppercase leading-tight max-w-3xl mx-auto">
                      {sec.title}
                    </h1>
                    <h2 className="text-sm sm:text-base font-bold text-atalaia-neon uppercase tracking-widest">
                      {sec.subtitle}
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mx-auto leading-relaxed text-xs sm:text-sm">
                      {sec.content[0]}
                    </p>
                  </div>
                );
              }

              return (
                <section
                  key={sec.id}
                  id={`policy-${sec.id}`}
                  className={`p-6 rounded-2xl border transition-all duration-300 relative ${
                    isActive 
                      ? 'bg-zinc-900/60 border-atalaia-neon/40 shadow-[0_0_30px_rgba(0,255,102,0.08)]' 
                      : sec.isHighlight 
                      ? 'bg-gradient-to-br from-emerald-950/40 to-black border-emerald-500/40' 
                      : 'bg-zinc-950/40 border-white/5 hover:border-white/10'
                  }`}
                >
                  {/* Active Anchor Indicator */}
                  {isActive && (
                    <div className="absolute -left-1 top-6 bottom-6 w-1.5 bg-atalaia-neon rounded-r-full shadow-[0_0_10px_#00FF66]" />
                  )}

                  {/* Section Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-atalaia-neon font-mono font-black text-sm flex items-center justify-center shrink-0">
                      {sec.number}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                      {sec.title}
                    </h3>
                  </div>

                  {/* Section Content */}
                  {sec.isFlowchart ? (
                    <div className="space-y-3 p-4 bg-black/60 rounded-xl border border-white/10 font-sans text-xs sm:text-sm">
                      <div className="flex items-center justify-center gap-2 text-center py-2 px-4 bg-atalaia-neon/10 border border-atalaia-neon/30 text-atalaia-neon font-black uppercase rounded-lg">
                        📩 SOLICITAÇÃO RECEBIDA
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        <div className="p-3 bg-zinc-900/80 rounded-lg border border-white/5">
                          <span className="font-bold text-white block mb-1 text-xs uppercase tracking-wide text-atalaia-neon">1. Quem está solicitando?</span>
                          <ul className="space-y-1 text-zinc-300 text-xs">
                            <li>• <strong>Cliente:</strong> Analisar normalmente.</li>
                            <li>• <strong>Pessoa na imagem:</strong> Tratar como exercício de direito de titular.</li>
                            <li>• <strong>Terceiro:</strong> Analisar legitimidade e fundamentação.</li>
                            <li>• <strong>Polícia / Autoridade:</strong> Analisar requisição oficial formal.</li>
                          </ul>
                        </div>

                        <div className="p-3 bg-zinc-900/80 rounded-lg border border-white/5">
                          <span className="font-bold text-white block mb-1 text-xs uppercase tracking-wide text-atalaia-neon">2. Responsabilidade sobre os Dados</span>
                          <p className="text-zinc-300 text-xs">
                            Se a ALIEN for controladora → analisa e responde.<br/>
                            Se for operadora em nome de condomínio/cliente → encaminha ao controlador responsável.
                          </p>
                        </div>

                        <div className="p-3 bg-zinc-900/80 rounded-lg border border-white/5">
                          <span className="font-bold text-white block mb-1 text-xs uppercase tracking-wide text-atalaia-neon">3. Presença de Terceiros</span>
                          <p className="text-zinc-300 text-xs">
                            Se houver terceiros identificáveis nas imagens, avaliar privacidade e aplicar limitações ou anonimização técnica.
                          </p>
                        </div>

                        <div className="p-3 bg-zinc-900/80 rounded-lg border border-white/5">
                          <span className="font-bold text-white block mb-1 text-xs uppercase tracking-wide text-atalaia-neon">4. Crime / Acidente / Investigação</span>
                          <p className="text-zinc-300 text-xs">
                            Orientar registro de Boletim de Ocorrência e solicitação oficial pela autoridade policial competente.
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-zinc-900/80 rounded-lg border border-white/5 mt-2">
                        <span className="font-bold text-white block mb-1 text-xs uppercase tracking-wide text-atalaia-neon">5. Registro e Rastreabilidade</span>
                        <p className="text-zinc-300 text-xs">
                          Toda solicitação, decisão tomada e eventual entrega de material é registrada nos logs operacionais da ALIEN.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-zinc-300 leading-relaxed">
                      {sec.content.map((paragraph, pIdx) => {
                        // Quotes or Callouts
                        if (paragraph.startsWith('“') || paragraph.startsWith('"')) {
                          return (
                            <div key={pIdx} className="p-4 rounded-xl bg-atalaia-neon/5 border-l-4 border-atalaia-neon text-white font-medium italic my-3 text-xs sm:text-sm">
                              {paragraph}
                            </div>
                          );
                        }

                        if (paragraph.startsWith('IMPORTANTE:')) {
                          return (
                            <div key={pIdx} className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm font-medium flex items-start gap-3 my-3">
                              <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                              <div>{paragraph}</div>
                            </div>
                          );
                        }

                        if (paragraph.startsWith('•') || paragraph.startsWith('a)') || paragraph.startsWith('b)') || paragraph.startsWith('c)') || paragraph.startsWith('d)') || paragraph.startsWith('e)') || paragraph.startsWith('f)') || paragraph.startsWith('g)') || paragraph.startsWith('h)') || paragraph.startsWith('i)') || paragraph.startsWith('j)')) {
                          return (
                            <div key={pIdx} className="flex items-start gap-2.5 pl-2 text-zinc-300">
                              <span className="text-atalaia-neon font-bold text-xs shrink-0 mt-0.5">•</span>
                              <span>{paragraph.replace(/^[•a-j]\)\s*/, '')}</span>
                            </div>
                          );
                        }

                        return (
                          <p key={pIdx} className="text-zinc-300 leading-relaxed">
                            {paragraph}
                          </p>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}

            {/* Bottom Seal and Signature */}
            <div className="p-6 rounded-2xl bg-[#0b0b0e] border border-white/10 text-center space-y-3 mt-12">
              <ShieldCheck size={36} className="mx-auto text-atalaia-neon" />
              <h4 className="text-sm font-black text-white uppercase tracking-widest">
                ALIEN SISTEMAS DE SEGURANÇA ELETRÔNICA
              </h4>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Conformidade com a LGPD (Lei nº 13.709/2018) • Sistema Atalaia de Segurança Colaborativa
              </p>
              <div className="pt-3 border-t border-white/5 flex flex-wrap justify-center gap-6 text-[10px] text-zinc-400 uppercase font-mono">
                <span>Versão Oficial 2025</span>
                <span>CNPJ: 51.482.661/0001-31</span>
                <span>Florianópolis - SC</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-4 sm:px-6 py-3 border-t border-white/10 bg-zinc-950/90 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-atalaia-neon" />
            <span>Documento oficial de diretrizes e procedimentos</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-policy-bottom-read-toggle"
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 flex items-center gap-1.5 transition-colors"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              <span>{isPlaying ? 'Pausar' : 'Leitura Automática'}</span>
            </button>

            <button
              id="btn-policy-bottom-close"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-atalaia-neon hover:bg-[#33ff85] text-black font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,255,102,0.2)]"
            >
              Entendido / Fechar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Reusable Button to trigger the Image Policy Popup
 */
interface ImagePolicyButtonProps {
  label?: string;
  variant?: 'primary' | 'outline' | 'badge' | 'tactical' | 'subtle';
  className?: string;
  showIcon?: boolean;
}

export const ImagePolicyButton: React.FC<ImagePolicyButtonProps> = ({
  label = 'Política de Fornecimento de Imagens',
  variant = 'tactical',
  className = '',
  showIcon = true
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (variant === 'badge') {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-atalaia-neon/10 hover:bg-atalaia-neon/20 border border-atalaia-neon/30 text-atalaia-neon text-xs font-bold transition-all shadow-[0_0_10px_rgba(0,255,102,0.1)] cursor-pointer ${className}`}
        >
          {showIcon && <Scale size={13} className="text-atalaia-neon" />}
          <span>{label}</span>
        </button>
        <ImagePolicyModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </>
    );
  }

  if (variant === 'outline') {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className={`px-4 py-2 rounded-xl border border-white/10 hover:border-atalaia-neon text-zinc-300 hover:text-atalaia-neon bg-black/40 hover:bg-atalaia-neon/5 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${className}`}
        >
          {showIcon && <FileText size={15} />}
          <span>{label}</span>
        </button>
        <ImagePolicyModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </>
    );
  }

  if (variant === 'subtle') {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className={`text-zinc-400 hover:text-atalaia-neon transition-colors text-xs flex items-center gap-1.5 cursor-pointer text-left ${className}`}
        >
          {showIcon && <Scale size={13} />}
          <span>{label}</span>
        </button>
        <ImagePolicyModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </>
    );
  }

  if (variant === 'primary') {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className={`px-5 py-2.5 rounded-xl bg-atalaia-neon hover:bg-[#33ff85] text-black font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,255,102,0.25)] flex items-center justify-center gap-2 cursor-pointer ${className}`}
        >
          {showIcon && <Scale size={16} className="text-black" />}
          <span>{label}</span>
        </button>
        <ImagePolicyModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </>
    );
  }

  // Default: Tactical
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`px-4 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-atalaia-neon/30 hover:border-atalaia-neon text-white hover:text-atalaia-neon text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,255,102,0.1)] flex items-center justify-center gap-2 cursor-pointer group ${className}`}
      >
        {showIcon && <Scale size={15} className="text-atalaia-neon group-hover:scale-110 transition-transform" />}
        <span>{label}</span>
        <ChevronRight size={13} className="text-zinc-500 group-hover:text-atalaia-neon group-hover:translate-x-0.5 transition-all" />
      </button>
      <ImagePolicyModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
