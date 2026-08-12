export type UserRole = 'AGENTE' | 'FISCAL' | 'DIRETOR' | 'MASTER';

export interface UserProfile {
  id: string;
  email: string;
  nome_completo: string;
  data_nascimento: string;
  cargo: UserRole;
  matricula?: string;
  senha?: string;
}

export interface EscalaItem {
  id: string;
  data: string; // YYYY-MM-DD
  tipo: 'PLANTAO' | 'EVENTO' | 'FERIADO' | 'FACULTATIVO';
  servidores: string;
  descricao?: string;
}

export interface FeiranteItem {
  id: string;
  data_prot: string;
  num_prot: string;
  feira: string; // "DA cultura", "do pescador", "da orla", "da rua 200"
  pasta: string;
  cpf: string;
  nome_pf: string;
  produtos: string;
  validade: string;
  rua: string;
  num: string;
  bairro: string;
  vinculo: 'SIM' | 'NÃO';
  func?: string;
  abertura?: string;
  cnpj?: string;
  razao?: string;
  rua_api?: string;
  num_api?: string;
  municipio?: string;
  estado?: string;
  cnae?: string;
  alvara?: 'SIM' | 'NÃO' | 'EM ANDAMENTO';
}

export interface RecadoMural {
  id: string;
  autor: string;
  cargo: string;
  data: string;
  titulo: string;
  conteudo: string;
  prioridade: 'NORMAL' | 'URGENTE' | 'ALERTA';
}

export interface ChatMessage {
  id: string;
  sender: string;
  role: string;
  time: string;
  text: string;
}

export type InspectionStatus = 'EM_ANDAMENTO' | 'CONCLUIDA' | 'NOTIFICADO' | 'INTERDITADO' | 'CONFORME';
export type RiskLevel = 'BAIXO' | 'MÉDIO' | 'ALTO' | 'CRÍTICO';
export type InspectionType = 'ROTINA' | 'DENÚNCIA' | 'RENOVAÇÃO' | 'REINSPEÇÃO' | 'OPERAÇÃO_VERÃO';

export interface InspectionCheckitem {
  id: string;
  categoria: string;
  item: string;
  status: 'CONFORME' | 'NAO_CONFORME' | 'NAO_APLICA';
  observacao?: string;
  fotos?: string[];
}

export interface FiscalizacaoItem {
  id: string;
  protocolo: string;
  dataHora: string;
  fiscalId: string;
  fiscalNome: string;
  estabelecimento: {
    nomeFantasia: string;
    razaoSocial: string;
    cnpjCpf: string;
    tipo: string; // Restaurante, Lanchonete, Feira Livre, Drogaria, Mercado, Hotel, etc.
    bairro: string;
    endereco: string;
    numero: string;
    responsavel: string;
    telefone: string;
  };
  tipoVistoria: InspectionType;
  risco: RiskLevel;
  status: InspectionStatus;
  checklists: InspectionCheckitem[];
  irregularidadesEncontradas: string[];
  medidasAdotadas: string; // Intimação, Auto de Infração, Interdição Parcial, Conforme, etc.
  prazoAdequacaoDias?: number;
  observacoesFiscais: string;
  fotosUrl: string[];
  assinaturaInspector?: string; // base64 / data url
  assinaturaResponsavel?: string; // base64 / data url
  coordenadas?: {
    lat: number;
    lng: number;
  };
  parecerIA?: string;
}

export type ProcessoStatus = 'DEFERIDO' | 'EM ANÁLISE' | 'INDEFERIDO' | 'PENDENTE DOCS' | 'VISTORIA AGENDADA' | 'NOTIFICADO';

export interface ProcessoItem {
  id: string;
  num_processo: string;
  data_protocolo: string;
  cnpj_cpf: string;
  razao_social: string;
  nome_fantasia: string;
  assunto: string;
  bairro: string;
  endereco: string;
  fiscal_responsavel: string;
  status: ProcessoStatus;
  validade?: string;
  observacoes?: string;
  cnaes?: string[];
  servidores?: { id: string; nome: string; matricula: string }[];
}

export interface PortalButton {
  id: string;
  nome: string;
  url: string;
  img: string;
  acao: 'link' | 'view';
  view?: 'home' | 'feiras' | 'agenda' | 'master' | 'fiscalizacao' | 'processos';
  badgetext?: string;
  somenteMaster?: boolean;
}
