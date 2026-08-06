import { FeiranteItem } from '../types';

// Webhook padrão do Google Apps Script
export const DEFAULT_SHEETS_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycby8SSrv45Hvn7dISRonoyaoe0ffLu8xtwzTB2lWZL09RSqHN-j9RfyDfDHP31nEnVC-Aw/exec';

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
