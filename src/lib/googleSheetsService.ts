import { FeiranteItem, ProcessoItem } from '../types';

// Webhook padrão do Google Apps Script para Feirantes
export const DEFAULT_SHEETS_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycby8SSrv45Hvn7dISRonoyaoe0ffLu8xtwzTB2lWZL09RSqHN-j9RfyDfDHP31nEnVC-Aw/exec';

// Webhook oficial do Google Apps Script para Processos Sanitários
export const PROCESSOS_SHEETS_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbyaTV2FDyJ2-tC5l7OXiEvD5DVw2QxH_CHO_rHKmdnYxu8bqDQapmP5K9h6C5TEaWWXTQ/exec';

export function getSheetsWebhookUrl(): string {
  return localStorage.getItem('visa_sheets_webhook_url') || DEFAULT_SHEETS_WEBHOOK_URL;
}

export function setSheetsWebhookUrl(url: string): void {
  localStorage.setItem('visa_sheets_webhook_url', url.trim());
}

/**
 * Busca a lista de feirantes diretamente da Planilha do Google Sheets via Webhook Apps Script
 */
export async function fetchFeirantesFromSheets(): Promise<FeiranteItem[] | null> {
  const webhookUrl = getSheetsWebhookUrl();
  if (!webhookUrl) return null;

  try {
    const res = await fetch(`${webhookUrl}?action=getFeirantes&t=${Date.now()}`);
    if (!res.ok) return null;

    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map((item: any, index: number) => ({
        id: item.id || `sheet-${index}-${Date.now()}`,
        data_prot: item.data_prot || item.DATA_PROT || item['DATA PROT'] || '',
        num_prot: item.num_prot || item.NUM_PROT || item['PROCESSO'] || '',
        feira: item.feira || item.FEIRA || '',
        pasta: item.pasta || item.PASTA || '',
        cpf: item.cpf || item.CPF || '',
        nome_pf: item.nome_pf || item.NOME_PF || item['NOME DO FEIRANTE'] || '',
        produtos: item.produtos || item.PRODUTOS || '',
        validade: item.validade || item.VALIDADE || '',
        rua: item.rua || item.RUA || '',
        num: item.num || item.NUM || '',
        bairro: item.bairro || item.BAIRRO || 'Centro',
        vinculo: item.vinculo || item.VINCULO || 'NÃO',
        func: item.func || item.FUNC || '',
        abertura: item.abertura || item.ABERTURA || '',
        cnpj: item.cnpj || item.CNPJ || '',
        razao: item.razao || item.RAZAO || '',
        rua_api: item.rua_api || '',
        num_api: item.num_api || '',
        municipio: item.municipio || 'BALNEÁRIO CAMBORIÚ',
        estado: item.estado || 'SC',
        cnae: item.cnae || '',
        alvara: item.alvara || item.ALVARA || 'SIM'
      }));
    }
  } catch (err) {
    console.warn('Erro ao buscar dados do Google Sheets:', err);
  }
  return null;
}

/**
 * Envia um novo feirante ou atualização para a Planilha do Google Sheets
 */
export async function saveFeiranteToSheets(item: FeiranteItem): Promise<boolean> {
  const webhookUrl = getSheetsWebhookUrl();
  if (!webhookUrl) return false;

  try {
    const payload = {
      action: 'saveFeirante',
      id: item.id,
      data_prot: item.data_prot,
      num_prot: item.num_prot,
      feira: item.feira,
      pasta: item.pasta,
      cpf: item.cpf,
      nome_pf: item.nome_pf,
      produtos: item.produtos,
      validade: item.validade,
      rua: item.rua,
      num: item.num,
      bairro: item.bairro,
      vinculo: item.vinculo,
      func: item.func,
      abertura: item.abertura,
      cnpj: item.cnpj,
      razao: item.razao,
      municipio: item.municipio,
      estado: item.estado,
      alvara: item.alvara
    };

    // Tenta POST normal com JSON
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      mode: 'no-cors' // Para evitar restrições de CORS do Google Apps Script no navegador
    });

    console.log('Dados do feirante enviados com sucesso para o Google Sheets');
    return true;
  } catch (err) {
    console.error('Erro ao enviar feirante para o Google Sheets:', err);
    return false;
  }
}

/**
 * Busca a lista de processos de fiscalização diretamente do Google Apps Script / Google Sheets
 */
export async function fetchProcessosFromSheets(): Promise<ProcessoItem[] | null> {
  try {
    const url = `${PROCESSOS_SHEETS_WEBHOOK_URL}?action=getProcessos&t=${Date.now()}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map((item: any, index: number) => ({
        id: item.id || item.ID || `proc-sheet-${index}-${Date.now()}`,
        num_processo: item.num_processo || item.NUM_PROCESSO || item.PROCESSO || item['Nº PROCESSO'] || `2026/${100 + index}`,
        data_protocolo: item.data_protocolo || item.DATA_PROTOCOLO || item.DATA || new Date().toLocaleDateString('pt-BR'),
        cnpj_cpf: item.cnpj_cpf || item.CNPJ_CPF || item.CNPJ || '00.000.000/0000-00',
        razao_social: item.razao_social || item.RAZAO_SOCIAL || item.RAZAO || 'EMPRESA REGISTRADA',
        nome_fantasia: item.nome_fantasia || item.NOME_FANTASIA || item.FANTASIA || item.razao_social || 'ESTABELECIMENTO',
        assunto: item.assunto || item.ASSUNTO || item.MOTIVACAO || 'Alvará Sanitário',
        bairro: item.bairro || item.BAIRRO || 'Centro',
        endereco: item.endereco || item.ENDERECO || '',
        fiscal_responsavel: item.fiscal_responsavel || item.FISCAL_RESPONSAVEL || item.FISCAL || 'Carlos Eduardo Silva',
        status: (item.status || item.STATUS || 'EM ANÁLISE').toUpperCase() as any,
        validade: item.validade || item.VALIDADE || '31/12/2026',
        observacoes: item.observacoes || item.OBSERVACOES || item.DESCRICAO || '',
        cnaes: Array.isArray(item.cnaes) ? item.cnaes : (item.cnaes ? String(item.cnaes).split(',') : []),
        servidores: Array.isArray(item.servidores) ? item.servidores : []
      }));
    }
  } catch (err) {
    console.warn('Erro ao buscar processos do Google Sheets:', err);
  }
  return null;
}

/**
 * Envia o formulário do Processo para o Google Apps Script / Google Sheets
 */
export async function saveProcessoToSheets(item: ProcessoItem, fullFormData?: any): Promise<boolean> {
  try {
    const payload = {
      action: 'saveProcesso',
      id: item.id,
      num_processo: item.num_processo,
      data_protocolo: item.data_protocolo,
      cnpj_cpf: item.cnpj_cpf,
      razao_social: item.razao_social,
      nome_fantasia: item.nome_fantasia,
      assunto: item.assunto,
      bairro: item.bairro,
      endereco: item.endereco,
      fiscal_responsavel: item.fiscal_responsavel,
      status: item.status,
      validade: item.validade || '31/12/2026',
      observacoes: item.observacoes || '',
      cnaes: (item.cnaes || []).join('; '),
      servidores: (item.servidores || []).map(s => `${s.nome} (${s.matricula})`).join(', '),
      ...(fullFormData || {})
    };

    // Tenta formato de envio POST em JSON
    await fetch(PROCESSOS_SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      mode: 'no-cors'
    });

    // Também dispara em URLSearchParams para formulários legados do Apps Script que usam e.parameter
    const params = new URLSearchParams();
    Object.entries(payload).forEach(([key, val]) => {
      params.append(key, typeof val === 'object' ? JSON.stringify(val) : String(val));
    });

    await fetch(PROCESSOS_SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      mode: 'no-cors'
    });

    console.log('Processo enviado com sucesso para a Planilha do Google Sheets (Apps Script)');
    return true;
  } catch (err) {
    console.error('Erro ao enviar processo para o Google Sheets:', err);
    return false;
  }
}

