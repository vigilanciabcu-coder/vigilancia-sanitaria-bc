import { UserProfile, EscalaItem, FeiranteItem, RecadoMural, ChatMessage, FiscalizacaoItem } from '../types';

const today = new Date();
const todayMM = String(today.getMonth() + 1).padStart(2, '0');
const todayDD = String(today.getDate()).padStart(2, '0');

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'u1',
    email: 'fiscal@bc.sc.gov.br',
    nome_completo: 'Carlos Eduardo Silva',
    data_nascimento: `1985-${todayMM}-${todayDD}`,
    cargo: 'FISCAL',
    matricula: 'FIS-4092',
    senha: '123456'
  },
  {
    id: 'u2',
    email: 'agente@bc.sc.gov.br',
    nome_completo: 'Ana Paula Oliveira',
    data_nascimento: '1990-11-20',
    cargo: 'AGENTE',
    matricula: 'AGE-1104',
    senha: '123456'
  },
  {
    id: 'u3',
    email: 'diretor@bc.sc.gov.br',
    nome_completo: 'Dr. Roberto Mendes',
    data_nascimento: '1978-03-08',
    cargo: 'DIRETOR',
    matricula: 'DIR-0001',
    senha: '123456'
  },
  {
    id: 'u4',
    email: 'master@bc.sc.gov.br',
    nome_completo: 'Administrador Master VISA',
    data_nascimento: '1980-01-01',
    cargo: 'MASTER',
    matricula: 'MST-0000',
    senha: '123456'
  }
];

export const INITIAL_ESCALA: EscalaItem[] = [
  {
    id: 'esc-1',
    data: new Date().toISOString().split('T')[0],
    tipo: 'PLANTAO',
    servidores: 'CARLOS SILVA / ANA OLIVEIRA',
    descricao: 'Plantão Noturno Orla & Feira da Cultura'
  },
  {
    id: 'esc-2',
    data: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    tipo: 'PLANTAO',
    servidores: 'MARCOS VINICIUS / LUCIA PEREIRA',
    descricao: 'Inspeção Estabelecimentos Gastronômicos Centro'
  },
  {
    id: 'esc-3',
    data: '2026-08-07',
    tipo: 'EVENTO',
    servidores: 'EQUIPE COMPLETA DVIS',
    descricao: 'Operação Verão Balneário Camboriú Blitz Noturna'
  },
  {
    id: 'esc-4',
    data: '2026-09-07',
    tipo: 'FERIADO',
    servidores: 'ESCALA DE EMERGÊNCIA 24H',
    descricao: 'Independência do Brasil - Plantão Especial'
  }
];

export const INITIAL_FEIRAS: FeiranteItem[] = [
  {
    id: '101',
    data_prot: '2026-01-15',
    num_prot: '2026/00142',
    feira: 'DA cultura, da orla',
    pasta: 'A-12',
    cpf: '123.456.789-00',
    nome_pf: 'JOÃO BATISTA DOS SANTOS',
    produtos: 'Pastéis artesanais e caldos de cana',
    validade: '2026-12-31',
    rua: 'Praça da Bíblia',
    num: 'S/N',
    bairro: 'Centro',
    vinculo: 'SIM',
    func: '2',
    abertura: '2021',
    cnpj: '34.567.890/0001-12',
    razao: 'J. B. SANTOS ALIMENTOS ME',
    rua_api: 'Av. Brasil',
    num_api: '1200',
    municipio: 'BALNEÁRIO CAMBORIÚ',
    estado: 'SC',
    cnae: '5611-2/03 Lanchonetes, casas de chá, de sucos e similares',
    alvara: 'SIM'
  },
  {
    id: '102',
    data_prot: '2026-02-10',
    num_prot: '2026/00891',
    feira: 'do pescador',
    pasta: 'B-04',
    cpf: '987.654.321-11',
    nome_pf: 'MARIA APARECIDA DA SILVA',
    produtos: 'Pescados frescos e frutos do mar embalados',
    validade: '2026-11-15',
    rua: 'Rua 2000',
    num: '450',
    bairro: 'Centro',
    vinculo: 'NÃO',
    func: '1',
    abertura: '2019',
    alvara: 'SIM'
  },
  {
    id: '103',
    data_prot: '2026-03-01',
    num_prot: '2026/01204',
    feira: 'da rua 200',
    pasta: 'C-08',
    cpf: '456.789.123-33',
    nome_pf: 'ROBERTO CARLOS KOHN',
    produtos: 'Queijos coloniais, embutidos e geleias',
    validade: '2026-10-30',
    rua: 'Rua 200',
    num: '110',
    bairro: 'Nações',
    vinculo: 'SIM',
    func: '3',
    abertura: '2018',
    cnpj: '12.345.678/0001-99',
    razao: 'KOHN PRODUTOS COLONIAIS LTDA',
    rua_api: 'Rua Israel',
    num_api: '55',
    municipio: 'BALNEÁRIO CAMBORIÚ',
    estado: 'SC',
    cnae: '4721-1/04 Comércio varejista de laticínios e frios',
    alvara: 'SIM'
  }
];

export const INITIAL_MURAL: RecadoMural[] = [
  {
    id: 'm-1',
    autor: 'Coordenação VISA',
    cargo: 'DIRETOR',
    data: 'Hoje - 08:30',
    titulo: 'ALERTA DE FISCALIZAÇÃO - OPERAÇÃO VERÃO',
    conteudo: 'Reforço na fiscalização de food trucks na Orla e feiras livres referente à refrigeração de pescados e ovos.',
    prioridade: 'URGENTE'
  },
  {
    id: 'm-2',
    autor: 'Laboratório Central',
    cargo: 'FISCAL',
    data: 'Ontem - 16:45',
    titulo: 'Laudos de Coleta de Água da Praia',
    conteudo: 'Os laudos de análise bacteriológica das amostras coletadas na Praia Central estão disponíveis na aba Laboratório.',
    prioridade: 'NORMAL'
  }
];

export const INITIAL_CHAT: ChatMessage[] = [
  {
    id: 'c-1',
    sender: 'Carlos Silva',
    role: 'FISCAL',
    time: '08:45',
    text: 'Iniciando vistoria de rotina nos quiosques da Feira da Cultura.'
  },
  {
    id: 'c-2',
    sender: 'Ana Oliveira',
    role: 'AGENTE',
    time: '08:52',
    text: 'Acompanhando equipe na Rua 2000. Sistema de emissão de Termos operando normal em tempo real.'
  }
];

export const INITIAL_FISCALIZACOES: FiscalizacaoItem[] = [
  {
    id: 'fisc-2026-001',
    protocolo: 'FIS-2026/0491',
    dataHora: '2026-07-30 09:15',
    fiscalId: 'u1',
    fiscalNome: 'Carlos Eduardo Silva',
    estabelecimento: {
      nomeFantasia: 'Restaurante Mariscos do Porto',
      razaoSocial: 'PORTO MARISCOS E RESTAURANTE LTDA',
      cnpjCpf: '28.910.221/0001-40',
      tipo: 'Restaurante / frutos do mar',
      bairro: 'Barra',
      endereco: 'Av. Beira Rio',
      numero: '850',
      responsavel: 'Fernando Dutra',
      telefone: '(47) 99881-2233'
    },
    tipoVistoria: 'ROTINA',
    risco: 'ALTO',
    status: 'NOTIFICADO',
    checklists: [
      { id: 'chk-1', categoria: 'Higiene e Limpeza', item: 'Higienização de bancadas e utensílios', status: 'NAO_CONFORME', observacao: 'Restos de matéria orgânica acumulados sob a bancada de corte de peixes' },
      { id: 'chk-2', categoria: 'Temperatura e Alimentos', item: 'Controle de temperatura de câmaras frias', status: 'NAO_CONFORME', observacao: 'Câmara de congelados operando a +2°C (exigido -18°C)' },
      { id: 'chk-3', categoria: 'Documentação', item: 'Alvará Sanitário vigente', status: 'CONFORME', observacao: 'Alvará válido até 12/2026' },
      { id: 'chk-4', categoria: 'Controle de Pragas', item: 'Comprovante de desinsetização', status: 'CONFORME', observacao: 'Certificado atualizado de empresa especializada' }
    ],
    irregularidadesEncontradas: [
      'Câmara fria com temperatura inadequada para congelados (+2°C em vez de <= -18°C).',
      'Acúmulo de sujidade e restos orgânicos sob a bancada de manipulação de frutos do mar.'
    ],
    medidasAdotadas: 'Termo de Intimação com suspensão preventiva de congelados sem identificação e prazo de 48h para correção térmica.',
    prazoAdequacaoDias: 2,
    observacoesFiscais: 'Orientado o responsável quanto às exigências da RDC 216/2004 ANVISA.',
    fotosUrl: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80'],
    coordenadas: { lat: -27.0035, lng: -48.5891 },
    parecerIA: 'Fundamentação legal: RDC Anvisa nº 216/2004 item 4.8 e Lei Municipal de Saúde. Risco moderado a alto de proliferação bacteriana por oscilação térmica.'
  },
  {
    id: 'fisc-2026-002',
    protocolo: 'FIS-2026/0492',
    dataHora: '2026-07-30 10:30',
    fiscalId: 'u2',
    fiscalNome: 'Ana Paula Oliveira',
    estabelecimento: {
      nomeFantasia: 'Quiosque Sabor da Ilha (Feira da Orla)',
      razaoSocial: 'MARIA APARECIDA DA SILVA',
      cnpjCpf: '987.654.321-11',
      tipo: 'Feira Livre / Lanchonete',
      bairro: 'Centro',
      endereco: 'Av. Atlântica',
      numero: 'Quiosque 14',
      responsavel: 'Maria Aparecida',
      telefone: '(47) 99112-4455'
    },
    tipoVistoria: 'ROTINA',
    risco: 'BAIXO',
    status: 'CONFORME',
    checklists: [
      { id: 'chk-10', categoria: 'Higiene e Limpeza', item: 'Uso de uniformes limpos e toucas', status: 'CONFORME' },
      { id: 'chk-11', categoria: 'Documentação', item: 'Credencial de feirante VISA', status: 'CONFORME' },
      { id: 'chk-12', categoria: 'Armazenamento', item: 'Lixeiras com acionamento por pedal', status: 'CONFORME' }
    ],
    irregularidadesEncontradas: [],
    medidasAdotadas: 'Termo de Vistoria Conforme concedido.',
    prazoAdequacaoDias: 0,
    observacoesFiscais: 'Estabelecimento atende rigorosamente as normas vigentes para feirantes.',
    fotosUrl: ['https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=600&q=80'],
    coordenadas: { lat: -26.9922, lng: -48.6345 },
    parecerIA: 'Vistoria regular com conformidade total às normas sanitárias municipais.'
  },
  {
    id: 'fisc-2026-003',
    protocolo: 'FIS-2026/0493',
    dataHora: '2026-07-30 11:00',
    fiscalId: 'u1',
    fiscalNome: 'Carlos Eduardo Silva',
    estabelecimento: {
      nomeFantasia: 'Supermercado e Açougue Beira Mar',
      razaoSocial: 'SUPERMERCADO BEIRA MAR EIRELI',
      cnpjCpf: '10.203.040/0001-50',
      tipo: 'Supermercado / Açougue',
      bairro: 'Nações',
      endereco: 'Av. Estado',
      numero: '2400',
      responsavel: 'Jorge Alcantara',
      telefone: '(47) 3367-1000'
    },
    tipoVistoria: 'DENÚNCIA',
    risco: 'CRÍTICO',
    status: 'INTERDITADO',
    checklists: [
      { id: 'chk-20', categoria: 'Qualidade dos Alimentos', item: 'Validade e rotulagem de carnes', status: 'NAO_CONFORME', observacao: 'Presença de 45kg de carne bovina moída previamente sem rotulagem de data de moagem' },
      { id: 'chk-21', categoria: 'Procedência', item: 'Selo de Inspeção SIM/SISP/SIF em cárneos', status: 'NAO_CONFORME', observacao: 'Cortes sem comprovação de origem e sem carimbo de abatedouro oficial' }
    ],
    irregularidadesEncontradas: [
      'Comércio de carne previamente moída (proibido por legislação sanitária sem embalagem industrial).',
      'Falta de comprovante de origem/inspeção veterinária de produto de origem animal (45 kg apreendidos).'
    ],
    medidasAdotadas: 'Auto de Infração e Termo de Interdição Cautelar do setor de açougue. Apreensão e descarte de 45kg de carnes irregulares.',
    prazoAdequacaoDias: 5,
    observacoesFiscais: 'Interdição cautelar imediata da seção de manipulação de carnes até adequação e apresentação de defesa.',
    fotosUrl: ['https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=600&q=80'],
    coordenadas: { lat: -26.9850, lng: -48.6380 },
    parecerIA: 'Infração grave à legislação sanitária de produtos de origem animal e Código de Defesa do Consumidor. Risco iminente à saúde pública.'
  }
];

export const BAIRROS_BC = [
  'Aririba',
  'Barra',
  'Centro',
  'Estados',
  'Estaleirinho',
  'Estaleiro',
  'Iate Clube',
  'Laranjeiras',
  'Municipios',
  'Nações',
  'Nova Esperança',
  'Pinho',
  'Pioneiros',
  'Praia dos Amores',
  'São Judas',
  'Taquaras',
  'Taquarinhas',
  'Várzea do Ranchinho',
  'Vila Real'
];
